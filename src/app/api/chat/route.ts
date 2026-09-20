import Anthropic from "@anthropic-ai/sdk";
import { TOOLS, runTool, type AgentAction } from "@/lib/agentTools";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are the assistant inside DV Outdoor's internal board-management tool. DV Outdoor is an outdoor-advertising company in Gujarat, India, operating roughly 650 hoardings and unipoles concentrated in the Saurashtra region. The people using you are the owner and the office staff.

Answer from the tools, never from memory. If a tool returns nothing, say so plainly rather than guessing.

How to be useful here:
- Be brief. These are working people checking something between calls, not readers.
- Money is Indian rupees with Indian digit grouping: ₹1,19,000 not ₹119,000.
- When you list boards, lead with the board code — that is how staff refer to them.
- When a number would be more convincing than a sentence, give the number.
- If a question is ambiguous in a way that changes the answer (which city, which month, asking rate vs agreed rate), ask rather than assume.

Changing data:
- book_board and set_board_status change inventory. Before calling either, confirm the specifics back to the user in one short line and wait for them to agree.
- Never invent a rate, a company name or dates. If the user has not given you a term you need, ask for it.
- If a board is already booked, say who holds it and when the lease ends instead of overwriting it.`;

type Body = { messages: Anthropic.MessageParam[] };

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not set." }, { status: 500 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "messages[] is required." }, { status: 400 });
  }

  // An org-level (unscoped) API key must name a workspace on every request.
  // A workspace-scoped key does not — leave ANTHROPIC_WORKSPACE_ID unset then.
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
  const client = new Anthropic({
    apiKey: key,
    ...(workspaceId ? { defaultHeaders: { "anthropic-workspace-id": workspaceId } } : {}),
  });
  const messages: Anthropic.MessageParam[] = [...body.messages];
  const actions: AgentAction[] = [];

  try {
    // Manual tool loop: we need to collect the actions each write-tool proposes
    // so the client can apply them, which the runner helper does not surface.
    for (let turn = 0; turn < 8; turn++) {
      const response = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: 16000,
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        tools: TOOLS,
        messages,
      });

      if (response.stop_reason === "refusal") {
        return Response.json({ text: "I can't help with that one.", actions: [] });
      }

      messages.push({ role: "assistant", content: response.content });

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      if (toolUses.length === 0) {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return Response.json({ text, actions });
      }

      // All tool_results for one assistant turn go back in a single user
      // message — splitting them teaches the model to stop calling in parallel.
      const results: Anthropic.ToolResultBlockParam[] = toolUses.map((use) => {
        try {
          const { result, action } = runTool(use.name, use.input as Record<string, unknown>);
          if (action) actions.push(action);
          return {
            type: "tool_result",
            tool_use_id: use.id,
            content: JSON.stringify(result),
          };
        } catch (err) {
          return {
            type: "tool_result",
            tool_use_id: use.id,
            is_error: true,
            content: err instanceof Error ? err.message : "Tool failed",
          };
        }
      });

      messages.push({ role: "user", content: results });
    }

    return Response.json({
      text: "That took more steps than I expected — try narrowing the question.",
      actions,
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "Anthropic API key rejected." }, { status: 401 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Rate limited — try again shortly." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("ANTHROPIC ERROR:", err.status, err.message);
      const needsWorkspace = err.message.includes("anthropic-workspace-id");
      return Response.json(
        {
          error: needsWorkspace
            ? "This API key is not scoped to a workspace. Set ANTHROPIC_WORKSPACE_ID in .env.local, or use a workspace-scoped key."
            : `Anthropic API error ${err.status}.`,
        },
        { status: 502 },
      );
    }
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}

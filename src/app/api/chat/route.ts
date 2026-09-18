import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createBoardTools } from "@/lib/claude/tools";

const SYSTEM_PROMPT = `You are the operations assistant inside DV Outdoor Advertising's board \
management portal, a Gujarat-based outdoor advertising company. You have tools to search and \
read the live board inventory (boards, their status, permit expiry, and status history) and to \
update a board's status/photo/note.

Always use a tool rather than guessing when a question is about specific boards, counts, or \
current state — the data changes over time and you should never answer from memory. When asked \
to change something, confirm what you changed and why (echo back the board code, the new status, \
and any note) once the update tool call succeeds. If a request is ambiguous about which board is \
meant, search first and ask for clarification rather than guessing which one to update. Keep \
answers concise and reference board codes (e.g. AHD-SG-014) when discussing specific boards.`;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured yet." }, { status: 503 });
  }

  const session = await getCurrentProfile();
  if (!session || session.profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const messages = body?.messages as Anthropic.MessageParam[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const tools = createBoardTools(supabase);
  const client = new Anthropic();

  try {
    const finalMessage = await client.beta.messages.toolRunner({
      model: "claude-opus-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      tools,
      messages,
    });

    const reply = finalMessage.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({
      reply: reply || "I didn't get a response back — try rephrasing that.",
    });
  } catch (err) {
    console.error("chat route error:", err);
    return NextResponse.json(
      { error: "Something went wrong talking to the assistant." },
      { status: 500 },
    );
  }
}

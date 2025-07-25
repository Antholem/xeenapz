import { NextResponse } from "next/server";

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return new Response(null, { headers });
}

export async function POST(req: Request) {
  try {
    const { message, image } = await req.json();
    if (!message && !image)
      return NextResponse.json(
        { error: "Message or image is required" },
        { status: 400 }
      );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return NextResponse.json({ error: "API key not found" }, { status: 500 });

    const parts: any[] = [];
    if (message) parts.push({ text: message });
    if (image) {
      const [meta, data] = image.split(",");
      const mime = meta?.split(":")?.[1]?.split(";")?.[0] || "image/jpeg";
      parts.push({ inline_data: { mime_type: mime, data } });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      }
    );

    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");

    const data = await response.json();

    return new Response(JSON.stringify(data), { headers });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

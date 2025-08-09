import { NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib";

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return new Response(null, { headers });
}

export async function POST(req: Request) {
  try {
    const { message, image, model } = await req.json();
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
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image, // base64 string, no data:image/... prefix
        },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      }
    );

    const data = await response.json();

    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(JSON.stringify(data), { headers });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

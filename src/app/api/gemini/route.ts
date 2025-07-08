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
    const { text, image } = await req.json();

    console.log("Incoming Gemini Request:", { text, hasImage: !!image });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return NextResponse.json({ error: "API key not found" }, { status: 500 });

    const model = "gemini-1.5-flash";
    const isImageOnly = !!image && !text?.trim();
    const prompt = isImageOnly ? "Describe this image" : text?.trim() || "";

    const content: any = {
      contents: [
        {
          role: "user",
          parts: [],
        },
      ],
    };

    content.contents[0].parts.push({ text: prompt });

    if (image) {
      const base64 = image.split(",")[1];
      const mimeType = image.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

      content.contents[0].parts.push({
        inlineData: {
          mimeType,
          data: base64,
        },
      });
    }

    console.log("Gemini Request Payload:", JSON.stringify(content, null, 2));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      }
    );

    const data = await response.json();
    console.log("Gemini API Response:", data);

    if (!data || !data.candidates?.length) {
      return NextResponse.json(
        { error: "Empty response from Gemini", raw: data },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini error:", error);
    return NextResponse.json(
      { error: "Something went wrong while generating response." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ConversationData } from '@/types';
import { decodeTurboStream, extractFromChatGPTData } from '@/lib/chatgpt-parser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid ChatGPT share URL' }, { status: 400 });
    }

    const trimmed = url.trim();
    const shareMatch = trimmed.match(/(?:https?:\/\/)?(?:chatgpt\.com|chat\.openai\.com)\/share\/([a-zA-Z0-9\-_]+)/i);

    if (!shareMatch) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a link in the form: https://chatgpt.com/share/<id>' },
        { status: 400 }
      );
    }

    const shareId = shareMatch[1];
    const canonicalUrl = `https://chatgpt.com/share/${shareId}`;

    // Common realistic browser headers
    const browserHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    // 1. Fetch share HTML page
    const htmlRes = await fetch(canonicalUrl, { headers: browserHeaders });

    if (!htmlRes.ok) {
      return NextResponse.json(
        {
          error: `Could not reach ChatGPT servers (HTTP ${htmlRes.status}). Please check your connection or paste the conversation text directly.`,
        },
        { status: 422 }
      );
    }

    const html = await htmlRes.text();

    // 2. Extract Modern Turbo Stream calls (window.__reactRouterContext.streamController.enqueue)
    const enqueueMatches = html.matchAll(/streamController\.enqueue\(([\s\S]*?)\);/g);
    for (const match of enqueueMatches) {
      if (match[1]) {
        try {
          const rawArg = match[1].trim();
          const parsed = JSON.parse(rawArg);
          const streamArray = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;

          if (Array.isArray(streamArray)) {
            const decoded = decodeTurboStream(streamArray);

            // Check loaderData['routes/share.$shareId.($action)']
            const shareRoute = decoded?.loaderData?.['routes/share.$shareId.($action)'];
            if (shareRoute) {
              const serverResponse = shareRoute.serverResponse;

              if (serverResponse) {
                // Check if ChatGPT returned an error (e.g. invalid or expired share ID)
                if (serverResponse.type === 'error' || serverResponse.error) {
                  const errorMsg =
                    serverResponse.error ||
                    "This shared conversation could not be loaded. The link may have expired, was deleted, or is set to private.";
                  return NextResponse.json(
                    {
                      error: `ChatGPT reports: "${errorMsg}". You can still generate notes by copying the chat text and clicking "Paste from Clipboard"!`,
                      suggestPaste: true,
                    },
                    { status: 404 }
                  );
                }

                const conv = extractFromChatGPTData(serverResponse, canonicalUrl);
                if (conv && conv.messages.length > 0) {
                  return NextResponse.json(conv);
                }
              }
            }

            // Fallback: check any serverResponse or data in decoded object
            const conv = extractFromChatGPTData(decoded, canonicalUrl);
            if (conv && conv.messages.length > 0) {
              return NextResponse.json(conv);
            }
          }
        } catch (e) {
          // Continue searching other enqueues
        }
      }
    }

    // 3. Check for Remix Context (window.__remixContext)
    const remixMatch = html.match(/window\.__remixContext\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (remixMatch && remixMatch[1]) {
      try {
        const remixData = JSON.parse(remixMatch[1]);
        const routeData = remixData?.state?.loaderData;
        if (routeData) {
          for (const key of Object.keys(routeData)) {
            const val = routeData[key];
            const conv = extractFromChatGPTData(val?.serverResponse || val, canonicalUrl);
            if (conv && conv.messages.length > 0) {
              return NextResponse.json(conv);
            }
          }
        }
      } catch {
        // proceed
      }
    }

    // 4. Check for Next Data script (__NEXT_DATA__)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch && nextDataMatch[1]) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const serverData =
          nextData?.props?.pageProps?.serverResponse?.data ||
          nextData?.props?.pageProps?.data;
        if (serverData) {
          const conv = extractFromChatGPTData(serverData, canonicalUrl);
          if (conv && conv.messages.length > 0) {
            return NextResponse.json(conv);
          }
        }
      } catch {
        // proceed
      }
    }

    // 5. Try Backend API as fallback
    try {
      const apiRes = await fetch(`https://chatgpt.com/backend-api/share/${shareId}`, {
        headers: {
          'User-Agent': browserHeaders['User-Agent'],
          Accept: 'application/json',
        },
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        const conv = extractFromChatGPTData(data, canonicalUrl);
        if (conv && conv.messages.length > 0) {
          return NextResponse.json(conv);
        }
      }
    } catch {
      // proceed
    }

    // If all extraction attempts fail, suggest quick paste
    return NextResponse.json(
      {
        error:
          "This conversation could not be loaded directly (it may be expired, private, or blocked by Cloudflare verification). Please click 'Paste from Clipboard' below to format your chat instantly!",
        suggestPaste: true,
      },
      { status: 422 }
    );
  } catch (err: any) {
    console.error('Extraction error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to extract ChatGPT conversation' },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { demoClient, getAttorneyById, getCategoryById } from "@/lib/data";
import type { VideoCall } from "@/lib/types";
import { makeId, nowIso } from "@/lib/utils";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    attorneyId: string;
    legalCategoryId: string;
    clientId?: string;
  };

  const attorney = getAttorneyById(body.attorneyId);
  const category = getCategoryById(body.legalCategoryId);

  if (!attorney || !category) {
    return NextResponse.json({ error: "Attorney or category not found." }, { status: 404 });
  }

  const roomName = `lod-${category.slug}-${makeId("room").replace("room_", "")}`;
  const apiKey = process.env.VIDEO_PROVIDER_API_KEY;
  const dailyDomain = process.env.VIDEO_PROVIDER_DOMAIN;
  let videoRoomUrl = dailyDomain ? `https://${dailyDomain}/${roomName}` : `/call/${roomName}`;

  if (apiKey && dailyDomain) {
    try {
      const response = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: roomName,
          privacy: "private",
          properties: {
            enable_recording: "cloud",
            exp: Math.floor(Date.now() / 1000) + 60 * 60
          }
        })
      });

      if (response.ok) {
        const dailyRoom = (await response.json()) as { url?: string };
        videoRoomUrl = dailyRoom.url ?? videoRoomUrl;
      }
    } catch {
      videoRoomUrl = `/call/${roomName}`;
    }
  }

  const call: VideoCall = {
    id: makeId("call"),
    clientId: body.clientId ?? demoClient.id,
    attorneyId: attorney.id,
    legalCategoryId: category.id,
    status: "active",
    videoRoomId: roomName,
    videoRoomUrl,
    startedAt: nowIso(),
    preliminaryGuidanceSeconds: 0,
    recordingUrl: "Recording placeholder: enable after consent and jurisdiction checks."
  };

  return NextResponse.json(call);
}

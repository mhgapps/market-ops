import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { AssetTransferService } from "@/services/asset-transfer.service";
import { transferAssetSchema } from "@/lib/validations/assets-vendors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/assets/[id]/transfer
 * Transfer asset to new location
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = transferAssetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const service = new AssetTransferService();
    const transfer = await service.transferAsset({
      asset_id: id,
      ...validationResult.data,
    });

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error) {
    console.error("Error transferring asset:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("already at this location")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to transfer asset" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/assets/[id]/transfer
 * Get transfer history for asset
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const service = new AssetTransferService();
    const history = await service.getAssetTransferHistory(id);

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching transfer history:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Failed to fetch transfer history" },
      { status: 500 },
    );
  }
}

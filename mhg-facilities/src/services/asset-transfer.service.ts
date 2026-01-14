import {
  AssetTransferDAO,
  type AssetTransferWithRelations,
} from '@/dao/asset-transfer.dao'
import { AssetDAO } from '@/dao/asset.dao'
import type { Database } from '@/types/database-extensions'

type AssetTransferInsert = Database['public']['Tables']['asset_transfers']['Insert']

export interface TransferAssetDTO {
  asset_id: string
  to_location_id: string
  transferred_by: string
  reason?: string
  notes?: string
}

export interface AssetTransferHistory {
  transfer_count: number
  transfers: AssetTransferWithRelations[]
  current_location_id: string | null
}

/**
 * Service for managing asset transfers between locations
 * Creates audit trail of all asset movements
 */
export class AssetTransferService {
  constructor(
    private transferDAO = new AssetTransferDAO(),
    private assetDAO = new AssetDAO()
  ) {}

  /**
   * Transfer asset to new location
   * Creates audit record and updates asset location
   */
  async transferAsset(data: TransferAssetDTO): Promise<AssetTransferWithRelations> {
    // Verify asset exists
    const asset = await this.assetDAO.findById(data.asset_id)
    if (!asset) {
      throw new Error('Asset not found')
    }

    // Get current location (from_location)
    const fromLocationId = asset.location_id

    // Validate not transferring to same location
    if (fromLocationId === data.to_location_id) {
      throw new Error('Asset is already at this location')
    }

    // Create transfer record
    const transferData: Partial<AssetTransferInsert> = {
      asset_id: data.asset_id,
      from_location_id: fromLocationId,
      to_location_id: data.to_location_id,
      transferred_by: data.transferred_by,
      reason: data.reason ?? null,
      notes: data.notes ?? null,
      transferred_at: new Date().toISOString(),
    }

    const transfer = await this.transferDAO.create(transferData)

    // Update asset location
    await this.assetDAO.update(data.asset_id, {
      location_id: data.to_location_id,
    })

    // Return transfer with relations
    const transferWithRelations = await this.transferDAO.findById(transfer.id)
    if (!transferWithRelations) {
      throw new Error('Transfer created but failed to retrieve')
    }

    return transferWithRelations
  }

  /**
   * Get transfer history for an asset
   */
  async getAssetTransferHistory(assetId: string): Promise<AssetTransferHistory> {
    // Verify asset exists
    const asset = await this.assetDAO.findById(assetId)
    if (!asset) {
      throw new Error('Asset not found')
    }

    const transfers = await this.transferDAO.findByAsset(assetId)
    const count = await this.transferDAO.countByAsset(assetId)

    return {
      transfer_count: count,
      transfers,
      current_location_id: asset.location_id,
    }
  }

  /**
   * Get transfers from a location
   */
  async getTransfersFromLocation(
    locationId: string
  ): Promise<AssetTransferWithRelations[]> {
    return this.transferDAO.findFromLocation(locationId)
  }

  /**
   * Get transfers to a location
   */
  async getTransfersToLocation(
    locationId: string
  ): Promise<AssetTransferWithRelations[]> {
    return this.transferDAO.findToLocation(locationId)
  }

  /**
   * Get recent transfers (last N days)
   */
  async getRecentTransfers(days = 30): Promise<AssetTransferWithRelations[]> {
    return this.transferDAO.findRecent(days)
  }

  /**
   * Get transfer by ID
   */
  async getTransferById(id: string): Promise<AssetTransferWithRelations | null> {
    return this.transferDAO.findById(id)
  }

  /**
   * Get location transfer summary
   * Shows inbound and outbound transfer counts
   */
  async getLocationTransferSummary(locationId: string): Promise<LocationTransferSummary> {
    const transfersFrom = await this.transferDAO.findFromLocation(locationId)
    const transfersTo = await this.transferDAO.findToLocation(locationId)

    return {
      location_id: locationId,
      total_outbound: transfersFrom.length,
      total_inbound: transfersTo.length,
      net_change: transfersTo.length - transfersFrom.length,
      recent_outbound: transfersFrom.slice(0, 10),
      recent_inbound: transfersTo.slice(0, 10),
    }
  }

  /**
   * Bulk transfer multiple assets to same location
   */
  async bulkTransferAssets(
    assetIds: string[],
    toLocationId: string,
    transferredBy: string,
    reason?: string,
    notes?: string
  ): Promise<AssetTransferWithRelations[]> {
    if (assetIds.length === 0) {
      throw new Error('No assets specified for transfer')
    }

    const transfers: AssetTransferWithRelations[] = []
    const errors: string[] = []

    for (const assetId of assetIds) {
      try {
        const transfer = await this.transferAsset({
          asset_id: assetId,
          to_location_id: toLocationId,
          transferred_by: transferredBy,
          reason,
          notes,
        })
        transfers.push(transfer)
      } catch (error) {
        errors.push(
          `Failed to transfer asset ${assetId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    if (errors.length > 0 && transfers.length === 0) {
      throw new Error(`All transfers failed:\n${errors.join('\n')}`)
    }

    if (errors.length > 0) {
      console.warn(`Some transfers failed:\n${errors.join('\n')}`)
    }

    return transfers
  }
}

export interface LocationTransferSummary {
  location_id: string
  total_outbound: number
  total_inbound: number
  net_change: number
  recent_outbound: AssetTransferWithRelations[]
  recent_inbound: AssetTransferWithRelations[]
}

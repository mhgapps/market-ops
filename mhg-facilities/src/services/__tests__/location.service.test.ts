import { describe, it, expect, beforeEach } from 'vitest';
import { instance, mock, when, anything, verify } from 'ts-mockito';
import { LocationService } from '../location.service';
import { LocationDAO } from '@/dao/location.dao';
import { UserDAO } from '@/dao/user.dao';
import { TenantDAO } from '@/dao/tenant.dao';
import type { Database } from '@/types/database';

type Location = Database['public']['Tables']['locations']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];

describe('LocationService', () => {
  let service: LocationService;
  let mockLocationDAO: LocationDAO;
  let mockUserDAO: UserDAO;
  let mockTenantDAO: TenantDAO;

  const mockLocation: Location = {
    id: 'location-1',
    tenant_id: 'test-tenant-id',
    name: 'Building A',
    address: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    phone: null,
    square_footage: null,
    manager_id: 'manager-1',
    emergency_contact_phone: null,
    status: 'active',
    opened_date: null,
    closed_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  const mockUser: User = {
    id: 'user-1',
    tenant_id: 'test-tenant-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'staff',
    phone: null,
    location_id: null,
    language_preference: 'en',
    is_active: true,
    deactivated_at: null,
    notification_preferences: { email: true, sms: false, push: true },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  const mockTenant: Tenant = {
    id: 'tenant-1',
    name: 'Test Tenant',
    slug: 'test-tenant',
    plan: 'free',
    status: 'trial',
    trial_ends_at: '2024-02-01T00:00:00Z',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    max_users: 5,
    max_locations: 3,
    storage_limit_gb: 5,
    features: {},
    branding: {},
    custom_domain: null,
    domain_verified_at: null,
    owner_email: 'owner@test.com',
    billing_email: null,
    phone: null,
    address: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  beforeEach(() => {
    mockLocationDAO = mock(LocationDAO);
    mockUserDAO = mock(UserDAO);
    mockTenantDAO = mock(TenantDAO);

    service = new LocationService(
      instance(mockLocationDAO),
      instance(mockUserDAO),
      instance(mockTenantDAO)
    );
  });

  describe('getAllLocations', () => {
    it('should return all locations', async () => {
      when(mockLocationDAO.findAll()).thenResolve([mockLocation]);

      const result = await service.getAllLocations();

      expect(result).toEqual([mockLocation]);
      verify(mockLocationDAO.findAll()).once();
    });

    it('should return empty array if no locations', async () => {
      when(mockLocationDAO.findAll()).thenResolve([]);

      const result = await service.getAllLocations();

      expect(result).toEqual([]);
    });
  });

  describe('getLocationById', () => {
    it('should return location by ID', async () => {
      when(mockLocationDAO.findById('location-1')).thenResolve(mockLocation);

      const result = await service.getLocationById('location-1');

      expect(result).toEqual(mockLocation);
      verify(mockLocationDAO.findById('location-1')).once();
    });

    it('should throw error if location not found', async () => {
      when(mockLocationDAO.findById('non-existent')).thenResolve(null);

      await expect(service.getLocationById('non-existent')).rejects.toThrow(
        'Location not found'
      );
    });
  });

  describe('createLocation', () => {
    it('should create location successfully', async () => {
      const input = {
        name: 'Building A',
        address: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
      };

      when(mockLocationDAO.createLocation(anything())).thenResolve(mockLocation);

      const result = await service.createLocation(input);

      expect(result).toEqual(mockLocation);
      verify(mockLocationDAO.createLocation(anything())).once();
    });

    it('should validate manager exists when manager_id provided', async () => {
      const input = {
        name: 'Building A',
        manager_id: 'manager-1',
      };

      when(mockUserDAO.findById('manager-1')).thenResolve(mockUser);
      when(mockLocationDAO.createLocation(anything())).thenResolve(mockLocation);

      await service.createLocation(input);

      verify(mockUserDAO.findById('manager-1')).once();
    });

    it('should throw error if manager not found', async () => {
      const input = {
        name: 'Building A',
        manager_id: 'non-existent',
      };

      when(mockUserDAO.findById('non-existent')).thenResolve(null);

      await expect(service.createLocation(input)).rejects.toThrow('Manager not found');
    });
  });

  describe('updateLocation', () => {
    it('should update location successfully', async () => {
      const updates = {
        name: 'Building B',
        address: '456 Main St',
      };

      when(mockLocationDAO.findById('location-1')).thenResolve(mockLocation);
      when(mockLocationDAO.updateLocation('location-1', anything())).thenResolve({
        ...mockLocation,
        ...updates,
      });

      const result = await service.updateLocation('location-1', updates);

      expect(result.name).toBe('Building B');
      verify(mockLocationDAO.updateLocation('location-1', anything())).once();
    });

    it('should throw error if location not found', async () => {
      when(mockLocationDAO.findById('non-existent')).thenResolve(null);

      await expect(
        service.updateLocation('non-existent', { name: 'Building B' })
      ).rejects.toThrow('Location not found');
    });
  });

  describe('deleteLocation', () => {
    it('should soft delete location', async () => {
      when(mockLocationDAO.findById('location-1')).thenResolve(mockLocation);
      when(mockLocationDAO.softDelete('location-1')).thenResolve();

      await service.deleteLocation('location-1');

      verify(mockLocationDAO.softDelete('location-1')).once();
    });

    it('should throw error if location not found', async () => {
      when(mockLocationDAO.findById('non-existent')).thenResolve(null);

      await expect(service.deleteLocation('non-existent')).rejects.toThrow(
        'Location not found'
      );
    });
  });

  describe('assignManager', () => {
    it('should assign manager to location', async () => {
      when(mockLocationDAO.findById('location-1')).thenResolve(mockLocation);
      when(mockUserDAO.findById('manager-1')).thenResolve(mockUser);
      when(mockLocationDAO.assignManager('location-1', 'manager-1')).thenResolve({
        ...mockLocation,
        manager_id: 'manager-1',
      });

      const result = await service.assignManager('location-1', 'manager-1');

      expect(result.manager_id).toBe('manager-1');
      verify(mockLocationDAO.assignManager('location-1', 'manager-1')).once();
    });

    it('should unassign manager when null provided', async () => {
      when(mockLocationDAO.findById('location-1')).thenResolve(mockLocation);
      when(mockLocationDAO.assignManager('location-1', null)).thenResolve({
        ...mockLocation,
        manager_id: null,
      });

      const result = await service.assignManager('location-1', null);

      expect(result.manager_id).toBeNull();
    });
  });
});

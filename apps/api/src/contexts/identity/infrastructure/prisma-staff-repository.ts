import type { StaffRole } from '@nexa/types';
import type { PrismaClient } from '@prisma/client';

import type { Staff, StaffRepository } from '../domain/staff-repository';

const STAFF_ROLES = new Set<string>(['admin', 'hostess']);

export class PrismaStaffRepository implements StaffRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(userId: string): Promise<Staff | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, restaurantId: true },
    });

    // `role` is a plain nullable string in the schema, so a diner can reach
    // here if a caller passes their id; treat non-staff as absent.
    if (!row || !row.role || !STAFF_ROLES.has(row.role)) return null;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role as StaffRole,
      restaurantId: row.restaurantId,
    };
  }
}

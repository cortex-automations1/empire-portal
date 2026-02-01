/**
 * Entity Types
 * Represents business entities in the Keystone Business Group empire
 */

export type EntityType = 'parent' | 'investment' | 'operating';

export type EntityStatus = 'active' | 'building' | 'planned';

export interface Entity {
  id: string;
  name: string; // Short name: 'KBG', 'KFG', 'MYTE', etc.
  legalName: string; // Legal entity name
  type: EntityType;
  industry?: string;
  status: EntityStatus;
  mercuryKey?: string; // Reference to Mercury API key
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  entityId: string;
  mercuryAccountId: string;
  accountName: string;
  accountType: 'checking' | 'savings';
  nickname?: string;
  routingNumber: string;
  accountNumber: string;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Balance {
  id: string;
  accountId: string;
  balance: number;
  available?: number;
  currency: string;
  date: Date;
  timestamp: Date;
}

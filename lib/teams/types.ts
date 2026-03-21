export type OrgRole = "owner" | "manager" | "member";

export interface Organization {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly ownerId: number;
  readonly createdAt: string;
}

export interface OrgMember {
  readonly id: number;
  readonly userId: number;
  readonly username: string;
  readonly role: OrgRole;
  readonly joinedAt: string;
}

export interface OrgInvite {
  readonly id: number;
  readonly code: string;
  readonly role: OrgRole;
  readonly expiresAt: string;
  readonly usedBy: number | null;
}

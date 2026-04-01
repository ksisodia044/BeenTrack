import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const signInMock = vi.fn();
const signUpMock = vi.fn();
const signOutMock = vi.fn();
const unsubscribeMock = vi.fn();

let profileResult: {
  data: any;
  error: any;
};

let roleResult: {
  data: any;
  error: any;
};

const fromMock = vi.fn((table: string) => {
  if (table === "profiles") {
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve(profileResult),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    };
  }

  if (table === "user_roles") {
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve(roleResult),
        }),
      }),
    };
  }

  throw new Error(`Unexpected table access: ${table}`);
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: unsubscribeMock,
          },
        },
      }),
      getSession: () => getSessionMock(),
      signInWithPassword: (...args: unknown[]) => signInMock(...args),
      signUp: (...args: unknown[]) => signUpMock(...args),
      signOut: (...args: unknown[]) => signOutMock(...args),
    },
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { AuthProvider, useAuth } from "@/hooks/useAuth";

function AuthProbe() {
  const { user, role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>guest</div>;
  }

  return <div>{`${user?.email}|${role}`}</div>;
}

describe("AuthProvider edge cases", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    signInMock.mockReset();
    signUpMock.mockReset();
    signOutMock.mockReset();
    unsubscribeMock.mockReset();
    fromMock.mockClear();

    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "auth-user-1",
            email: "edge@example.com",
          },
        },
      },
    });

    profileResult = {
      data: {
        id: "auth-user-1",
        name: "Edge User",
        phone: null,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    };

    roleResult = {
      data: {
        role: "ADMIN",
      },
      error: null,
    };
  });

  it("treats a missing profile as unauthenticated", async () => {
    profileResult = {
      data: null,
      error: { message: "Profile not found" },
    };

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(await screen.findByText("guest")).toBeInTheDocument();
  });

  it("defaults missing roles to STAFF when the profile exists", async () => {
    roleResult = {
      data: null,
      error: { message: "Role not found" },
    };

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(await screen.findByText("edge@example.com|STAFF")).toBeInTheDocument();
  });
});

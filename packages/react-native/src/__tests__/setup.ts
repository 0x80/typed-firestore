import { vi } from "vitest";

// Mock Firebase Firestore
vi.mock("@react-native-firebase/firestore", () => {
  const queryConstraintMock = {
    _apply: vi.fn(),
  };

  const createQueryConstraint = () => ({
    ...queryConstraintMock,
  });

  return {
    default: () => ({
      collection: vi.fn(),
    }),
    collection: vi.fn(),
    doc: vi.fn((_collectionRef: unknown, id: string) => ({
      id,
      path: `mock/${id}`,
    })),
    query: vi.fn(),
    limit: vi.fn().mockReturnValue(createQueryConstraint()),
    where: vi.fn().mockReturnValue(createQueryConstraint()),
    orderBy: vi.fn().mockReturnValue(createQueryConstraint()),
    onSnapshot: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn().mockResolvedValue(undefined),
    deleteDoc: vi.fn().mockResolvedValue(undefined),
    updateDoc: vi.fn().mockResolvedValue(undefined),
  };
});

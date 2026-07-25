import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TripMember } from "../../../domain/models";
import { TripMemberList } from "./TripMemberList";

const members: TripMember[] = [
  { id: "owner", displayName: "Gwen" },
  { id: "other", displayName: "Alex" },
];

describe("TripMemberList", () => {
  it("shows one separate badge for the owner", () => {
    const markup = renderToStaticMarkup(
      <TripMemberList
        members={members}
        ownerMemberId="owner"
      />,
    );

    expect(markup).toContain(">Gwen</span>");
    expect(markup).toContain(
      '<span class="role-badge">Owner</span>',
    );
    expect(markup.match(/class="role-badge"/g)).toHaveLength(
      1,
    );
    expect(members[0].displayName).toBe("Gwen");
    expect(members[0].displayName).not.toContain("(Owner)");
  });

  it("does not depend on the current viewer role", () => {
    const ownerView = renderToStaticMarkup(
      <TripMemberList
        members={members}
        ownerMemberId="owner"
      />,
    );
    const collaboratorView = renderToStaticMarkup(
      <TripMemberList
        members={members}
        ownerMemberId="owner"
      />,
    );

    expect(collaboratorView).toBe(ownerView);
  });

  it("renders a legacy owner named You as Owner", () => {
    const legacyMembers: TripMember[] = [
      { id: "owner", displayName: "You" },
      { id: "other", displayName: "You" },
    ];
    const markup = renderToStaticMarkup(
      <TripMemberList
        members={legacyMembers}
        ownerMemberId="owner"
      />,
    );

    expect(markup.match(/>Owner<\/span>/g)).toHaveLength(2);
    expect(markup.match(/>You<\/span>/g)).toHaveLength(1);
    expect(legacyMembers[0].displayName).toBe("You");
  });
});

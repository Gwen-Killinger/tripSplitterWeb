import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ensureAuthenticated } from "../firebase/ensureAuthenticated";
import { tripRepository } from "../repositories/repositoryInstance";

export function JoinTripPage() {
  const navigate = useNavigate();
  const { inviteToken } = useParams();
  const [isPreparing, setIsPreparing] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authReloadCount, setAuthReloadCount] = useState(0);
  const isJoiningRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    async function prepareAuthentication() {
      setIsPreparing(true);
      setError(null);

      try {
        await ensureAuthenticated();

        if (!isCancelled) {
          setIsAuthReady(true);
        }
      } catch (caughtError) {
        console.error(
          "Unable to prepare invite authentication:",
          caughtError,
        );

        if (!isCancelled) {
          setIsAuthReady(false);
          setError(
            "Unable to prepare your account. Please try again.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsPreparing(false);
        }
      }
    }

    void prepareAuthentication();

    return () => {
      isCancelled = true;
    };
  }, [authReloadCount]);

  async function handleJoin(): Promise<void> {
    if (!inviteToken || isJoiningRef.current) {
      return;
    }

    isJoiningRef.current = true;
    setIsJoining(true);
    setError(null);

    try {
      const result =
        await tripRepository.acceptTripInvite(inviteToken);

      navigate(`/trips/${result.tripId}`, {
        replace: true,
      });
    } catch (caughtError) {
      console.error("Unable to accept trip invite:", caughtError);

      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "";
      setError(
        message.includes("invalid") ||
          message.includes("no longer active")
          ? "This invite is invalid or no longer active."
          : "Unable to join the trip. Please try again.",
      );
    } finally {
      isJoiningRef.current = false;
      setIsJoining(false);
    }
  }

  if (!inviteToken) {
    return (
      <section>
        <h1>Invalid Invite</h1>
        <p>This invite link is incomplete.</p>
        <Link to="/trips">View your trips</Link>
      </section>
    );
  }

  return (
    <section className="join-trip">
      <h1>Join a Shared Trip</h1>
      <p>
        Joining gives this account permission to manage the
        trip’s members and expenses.
      </p>

      {isPreparing ? (
        <p>Preparing your account...</p>
      ) : !isAuthReady ? (
        <button
          className="primary-button"
          type="button"
          onClick={() =>
            setAuthReloadCount(
              (currentCount) => currentCount + 1,
            )
          }
        >
          Try Again
        </button>
      ) : (
        <button
          className="primary-button"
          type="button"
          disabled={isJoining}
          onClick={() => {
            void handleJoin();
          }}
        >
          {isJoining ? "Joining..." : "Join Trip"}
        </button>
      )}

      {error !== null && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

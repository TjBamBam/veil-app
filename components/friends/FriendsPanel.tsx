"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Check, X, MessageCircle, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useFriends } from "@/hooks/useFriends";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/app";

export function FriendsPanel({ userId }: { userId: string }) {
  const router = useRouter();
  const { friends, incoming, outgoing, loading, sendRequest, respondToRequest, unfriend, searchUsers } =
    useFriends(userId);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await searchUsers(q);
    setResults(res);
    setSearching(false);
  }

  async function handleSendRequest(addresseeId: string) {
    setPendingActions((s) => new Set(s).add(addresseeId));
    const { error } = await sendRequest(addresseeId);
    setPendingActions((s) => { const n = new Set(s); n.delete(addresseeId); return n; });
    if (error) {
      toast.error(error.message.includes("unique") ? "Request already sent" : error.message);
    } else {
      toast.success("Friend request sent!");
    }
  }

  async function handleRespond(id: string, accept: boolean) {
    setPendingActions((s) => new Set(s).add(id));
    await respondToRequest(id, accept);
    setPendingActions((s) => { const n = new Set(s); n.delete(id); return n; });
    toast.success(accept ? "Friend added!" : "Request declined");
  }

  async function handleMessage(friendId: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: convId, error } = await (supabase as any).rpc("get_or_create_conversation", {
      other_user_id: friendId,
    });
    if (error) {
      console.error("RPC error:", error);
      toast.error("Could not open conversation: " + error.message);
      return;
    }
    if (!convId) {
      toast.error("Could not create conversation");
      return;
    }
    router.push(`/messages/${convId}`);
  }

  async function handleUnfriend(friendshipId: string) {
    await unfriend(friendshipId);
    toast.success("Removed friend");
  }

  function isFriend(profileId: string) {
    return friends.some((f) => f.profile.id === profileId);
  }
  function hasPendingTo(profileId: string) {
    return outgoing.some((f) => f.addressee_id === profileId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Friends</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by username…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search results */}
      {searchQuery && (
        <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No users found</p>
          ) : (
            results.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {(p.display_name || p.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {p.display_name || p.username}
                  </p>
                  <p className="text-xs text-muted-foreground">@{p.username}</p>
                </div>
                {isFriend(p.id) ? (
                  <Badge variant="secondary" className="text-xs">Friends</Badge>
                ) : hasPendingTo(p.id) ? (
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendRequest(p.id)}
                    disabled={pendingActions.has(p.id)}
                    className="shrink-0"
                  >
                    {pendingActions.has(p.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3 mr-1" />
                    )}
                    Add
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <Tabs defaultValue="friends">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="friends" className="flex-1">
            Friends
            {friends.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{friends.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            Requests
            {incoming.length > 0 && (
              <Badge className="ml-2 text-xs">{incoming.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No friends yet. Search above to add someone!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => {
                const name = f.profile.display_name || f.profile.username;
                return (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={f.profile.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">@{f.profile.username}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleMessage(f.profile.id)}
                      title="Send message"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                      onClick={() => handleUnfriend(f.id)}
                      title="Remove friend"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {incoming.length === 0 && outgoing.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No pending friend requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incoming.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Incoming ({incoming.length})
                  </p>
                  <div className="space-y-2">
                    {incoming.map((f) => {
                      const name = f.profile.display_name || f.profile.username;
                      return (
                        <div
                          key={f.id}
                          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={f.profile.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                              {name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{name}</p>
                            <p className="text-xs text-muted-foreground">@{f.profile.username}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-green-500 hover:bg-green-500/10"
                            onClick={() => handleRespond(f.id, true)}
                            disabled={pendingActions.has(f.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => handleRespond(f.id, false)}
                            disabled={pendingActions.has(f.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {outgoing.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Sent ({outgoing.length})
                  </p>
                  <div className="space-y-2">
                    {outgoing.map((f) => {
                      const name = f.profile.display_name || f.profile.username;
                      return (
                        <div
                          key={f.id}
                          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={f.profile.avatar_url ?? undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                              {name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{name}</p>
                            <p className="text-xs text-muted-foreground">@{f.profile.username}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

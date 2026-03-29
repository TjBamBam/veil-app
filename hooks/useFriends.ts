import { useState, useEffect } from "react";
import type { Friend } from "@/types/app";

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);

  useEffect(() => { //Fetch friends }, []);

  const addFriend = async (id: string) => { //Add friend via API };

  const acceptFriend = async (id: string) => { //Accept friend request };

  const rejectFriend = async (id: string) => { //Reject friend request };

  const removeFriend = async (id: string) => { //Remove friend via API };

  return { friends, pending, addFriend, acceptFriend, rejectFriend, removeFriend };
};
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Search,
  Paperclip,
  X,
  File as FileIcon,
  MoreHorizontal,
  Edit,
  Trash2,
  Check,
  CheckCheck,
} from "lucide-react";
import { chatData, type ChatUser, type Message } from "./data";
import { cn } from "./lib/utils";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";

export function ChatView() {
  const [users, setUsers] = useState<ChatUser[]>(chatData);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    chatData.length > 0 ? chatData[0].id : null
  );
  const activeChat = useMemo(
    () => users.find((user) => user.id === activeChatId) ?? null,
    [users, activeChatId]
  );

  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMessage, setEditingMessage] = useState<{ index: number; text: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // Clear unread when opening a chat
  useEffect(() => {
    if (!activeChatId) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === activeChatId ? { ...u, unreadCount: 0 } : u))
    );
  }, [activeChatId]);

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachment(file);
      if (file.type.startsWith("image/")) {
        setAttachmentPreview(URL.createObjectURL(file));
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const handleSendMessage = () => {
    if (!activeChatId) return;
    if (message.trim() === "" && !attachment) return;

    let newAttachment: Message["attachment"];

    if (attachment) {
      newAttachment = {
        type: attachment.type.startsWith("image/") ? "image" : "file",
        name: attachment.name,
        url: URL.createObjectURL(attachment), // demo only
      };
    }

    const newMessage: Message = {
      from: "me",
      text: message,
      time: format(new Date(), "p"),
      attachment: newAttachment,
    };

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== activeChatId) return user;

        return {
          ...user,
          messages: [...user.messages, newMessage],
          lastMessage: message?.trim() ? message.trim() : "Attachment",
        };
      })
    );

    setMessage("");
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteMessage = (messageIndex: number) => {
    if (!activeChatId) return;

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== activeChatId) return user;

        const newMessages = user.messages.filter((_, index) => index !== messageIndex);

        // update lastMessage after deletion
        const last = newMessages[newMessages.length - 1];
        const nextLastMessage =
          last?.text?.trim() ||
          (last?.attachment ? "Attachment" : "") ||
          "No messages yet";

        return {
          ...user,
          messages: newMessages,
          lastMessage: nextLastMessage,
        };
      })
    );
  };

  const handleDeleteChat = () => {
    if (!activeChatId) return;

    setUsers((prev) => {
      const newUsers = prev.filter((u) => u.id !== activeChatId);
      setActiveChatId(newUsers.length > 0 ? newUsers[0].id : null);
      return newUsers;
    });
  };

  const handleStartEdit = (messageIndex: number) => {
    if (!activeChat) return;
    const messageToEdit = activeChat.messages[messageIndex];
    if (messageToEdit.text) setEditingMessage({ index: messageIndex, text: messageToEdit.text });
  };

  const handleCancelEdit = () => setEditingMessage(null);

  const handleSaveEdit = () => {
    if (!editingMessage || !activeChatId) return;

    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== activeChatId) return user;

        const newMessages = user.messages.map((msg, index) => {
          if (index === editingMessage.index) return { ...msg, text: editingMessage.text, edited: true };
          return msg;
        });

        // keep lastMessage in sync if last message edited
        const last = newMessages[newMessages.length - 1];
        const nextLastMessage =
          last?.text?.trim() || (last?.attachment ? "Attachment" : "") || user.lastMessage;

        return { ...user, messages: newMessages, lastMessage: nextLastMessage };
      })
    );

    setEditingMessage(null);
  };

  // FILTER: keep unread badge visible by not affecting layout
  const filteredUsers = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return users;
    return users.filter((user) => user.name.toLowerCase().includes(s));
  }, [users, searchTerm]);

  return (
    <Card className="h-[70vh] flex flex-col">
      <CardHeader>
        <CardTitle>Client Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-row p-0 overflow-hidden">
        {/* User List */}
        <div className="w-[320px] border-r flex flex-col min-w-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setActiveChatId(user.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition min-w-0",
                  activeChat?.id === user.id && "bg-secondary"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person face" />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {user.online && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{user.name}</p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">
                        {user.lastMessage.split(" ").length > 3
                          ? user.lastMessage.split(" ").slice(0, 3).join(" ") + "..."
                          : user.lastMessage}
                      </p>
                    </div>
                    {user.unreadCount > 0 && (
                      <div className="shrink-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-primary-foreground text-xs font-semibold">
                        {user.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {activeChat ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activeChat.avatar} alt={activeChat.name} data-ai-hint="person face" />
                    <AvatarFallback>
                      {activeChat.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {activeChat.online && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                  )}
                </div>

                <p className="font-semibold truncate">{activeChat.name}</p>

                <div className="ml-auto">
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Chat
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the entire chat history with {activeChat.name}. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteChat}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4 bg-background/90">
                <div className="space-y-4">
                  {activeChat.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn("flex", msg.from === "me" ? "justify-end" : "justify-start")}
                    >
                      <div className="group relative">
                        <div
                          className={cn(
                            "max-w-xs lg:max-w-md rounded-lg p-3 text-sm",
                            msg.from === "me" ? "bg-primary text-primary-foreground" : "bg-card border"
                          )}
                        >
                          {msg.attachment && (
                            <div className="mb-2">
                              {msg.attachment.type === "image" ? (
                                <img
                                  src={msg.attachment.url}
                                  alt={msg.attachment.name}
                                  className="rounded-lg max-w-full h-auto"
                                />
                              ) : (
                                <a
                                  href={msg.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-md",
                                    msg.from === "me"
                                      ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                                      : "bg-muted hover:bg-muted/80"
                                  )}
                                >
                                  <FileIcon className="h-6 w-6" />
                                  <div className="text-sm min-w-0">
                                    <p className="font-medium truncate">{msg.attachment.name}</p>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}

                          {editingMessage && editingMessage.index === index ? (
                            <div className="space-y-2">
                              <Input
                                value={editingMessage.text}
                                onChange={(e) =>
                                  setEditingMessage({ ...editingMessage, text: e.target.value })
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                                className="bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50 border-primary-foreground/20"
                              />
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-auto px-2 py-1 text-xs hover:bg-primary-foreground/20"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  className="h-auto px-2 py-1 text-xs bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>
                          )}

                          <div
                            className={cn(
                              "flex items-center gap-1.5 justify-end text-xs mt-1",
                              msg.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            {msg.edited && <span>edited</span>}
                            <span>{msg.time}</span>
                            {msg.from === "me" && (
                              <div className="flex-shrink-0">
                                {msg.read ? <CheckCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                              </div>
                            )}
                          </div>
                        </div>

                        {msg.from === "me" && !editingMessage && (
                          <AlertDialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-1/2 -translate-y-1/2 -left-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => handleStartEdit(index)}
                                  disabled={!msg.text}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>

                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this message.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteMessage(index)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {attachment && (
                <div className="p-2 border-t flex items-center justify-between bg-muted/50">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground min-w-0">
                    {attachmentPreview ? (
                      <img src={attachmentPreview} alt="Preview" className="h-10 w-10 object-cover rounded-md" />
                    ) : (
                      <FileIcon className="h-8 w-8 shrink-0" />
                    )}
                    <span className="truncate max-w-xs">{attachment.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAttachment(null);
                      setAttachmentPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                  </Button>

                  <input type="file" ref={fileInputRef} onChange={handleAttachment} className="hidden" />

                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    autoComplete="off"
                  />

                  <Button type="submit" size="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086L2.279 16.76a.75.75 0 00.95.826l14.5-5.25a.75.75 0 000-1.452l-14.5-5.25z" />
                    </svg>
                    <span className="sr-only">Send message</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-muted/20">
              <div className="text-center">
                <p className="text-lg font-medium">No chat selected</p>
                <p className="text-sm text-muted-foreground">
                  Select a client from the list to start a conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

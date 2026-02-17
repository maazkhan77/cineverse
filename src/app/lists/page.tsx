"use client";

import { useState } from "react";
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ContentModal } from "@/components/ui/ContentModal/ContentModal";
import { MovieCard } from "@/components/ui/MovieCard";
import { Magnetic } from "@/components/ui/Magnetic/Magnetic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import { Id } from "../../../convex/_generated/dataModel";
import { Input } from "@/components/ui/Input/Input";
import { Label } from "@/components/ui/Label/Label";
import { Textarea } from "@/components/ui/Textarea/Textarea";
import { Button3D } from "@/components/ui/Button3D/Button3D";
import { SelectionChip } from "@/components/ui/SelectionChip/SelectionChip";
import { SegmentedControl } from "@/components/ui/SegmentedControl/SegmentedControl";

interface ListItem {
  _id: Id<"listItems">;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  order: number;
  releaseDate?: string;
  voteAverage?: number;
}

interface UserList {
  _id: Id<"userLists">;
  name: string;
  description?: string;
  emoji?: string;
  isPublic: boolean;
  itemCount: number;
}

export default function ListsPage() {
  const { isAuthenticated } = useConvexAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedList, setSelectedList] = useState<Id<"userLists"> | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: number; mediaType: "movie" | "tv" } | null>(null);
  
  // Form state for new list
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListEmoji, setNewListEmoji] = useState("📁");
  const [newListPublic, setNewListPublic] = useState(false);
  
  // Queries
  const userLists = useQuery(api.lists.getUserLists) as UserList[] | undefined;
  const listDetails = useQuery(
    api.lists.getList,
    selectedList ? { listId: selectedList } : "skip"
  );
  
  // Mutations
  const createList = useMutation(api.lists.createList);
  const deleteList = useMutation(api.lists.deleteList);
  const removeFromList = useMutation(api.lists.removeFromList);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    
    await createList({
      name: newListName,
      description: newListDescription || undefined,
      emoji: newListEmoji || undefined,
      isPublic: newListPublic,
    });
    
    setNewListName("");
    setNewListDescription("");
    setNewListEmoji("📁");
    setNewListPublic(false);
    setShowCreateModal(false);
  };

  const handleDeleteList = async (listId: Id<"userLists">) => {
    if (!confirm("Are you sure you want to delete this list?")) return;
    await deleteList({ listId });
    if (selectedList === listId) setSelectedList(null);
  };

  const handleRemoveItem = async (e: React.MouseEvent, tmdbId: number) => {
    e.stopPropagation(); // Prevent card click
    if (!selectedList) return;
    await removeFromList({ listId: selectedList, tmdbId });
  };

  const emojis = ["📁", "❤️", "🎬", "👻", "🎭", "🌟", "🔥", "🎪", "🎯", "💎"];

  if (!isAuthenticated) {
    return (
      <>
        <main className={styles.main}>
          <div className={styles.authPrompt}>
            <h2>Sign in to create lists</h2>
            <p>Create custom collections of your favorite movies and shows</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className={styles.main}>
        <motion.header 
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={styles.title}>My Lists</h1>
          <p className={styles.subtitle}>Organize your favorites</p>
        </motion.header>

        <section className={styles.content}>
          <div className={styles.layout}>
            {/* Sidebar - List of lists */}
            <motion.aside 
              className={styles.sidebar}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button3D
                variant="primary"
                className={styles.createButton}
                onClick={() => setShowCreateModal(true)}
              >
                + Create New List
              </Button3D>
              
              <div className={styles.listsList}>
                {userLists?.map((list) => (
                  <button
                    key={list._id}
                    className={`${styles.listItem} ${selectedList === list._id ? styles.activeList : ""}`}
                    onClick={() => setSelectedList(list._id)}
                  >
                    <span className={styles.listEmoji}>{list.emoji || "📁"}</span>
                    <div className={styles.listInfo}>
                      <span className={styles.listName}>{list.name}</span>
                      <span className={styles.listCount}>
                        {list.itemCount} {list.itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                    {list.isPublic && <span className={styles.publicBadge}>Public</span>}
                  </button>
                ))}
                
                {!userLists?.length && (
                  <p className={styles.emptyLists}>No lists yet. Create one!</p>
                )}
              </div>
            </motion.aside>

            {/* Main content - Selected list */}
            <div className={styles.mainContent}>
              <AnimatePresence mode="wait">
                {selectedList && listDetails ? (
                  <motion.div
                    key={selectedList}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className={styles.listHeader}>
                      <div className={styles.listTitleRow}>
                        <span className={styles.bigEmoji}>{listDetails.emoji || "📁"}</span>
                        <h2 className={styles.listTitle}>{listDetails.name}</h2>
                      </div>
                      {listDetails.description && (
                        <p className={styles.listDescription}>{listDetails.description}</p>
                      )}
                      <Button3D
                        variant="secondary"
                        className={styles.deleteButton}
                        onClick={() => handleDeleteList(selectedList)}
                      >
                        Delete List
                      </Button3D>
                    </div>
                    
                    <motion.div 
                      className={styles.itemsGrid}
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: { staggerChildren: 0.05 }
                        }
                      }}
                      initial="hidden"
                      animate="visible"
                    >
                      {(listDetails.items as ListItem[])?.map((item) => (
                        <motion.div 
                          key={item._id} 
                          variants={{
                            hidden: { opacity: 0, scale: 0.9 },
                            visible: { opacity: 1, scale: 1 }
                          }}
                          className={styles.movieCardWrapper}
                        >
                          <MovieCard
                            id={item.tmdbId}
                            title={item.title}
                            posterPath={item.posterPath}
                            mediaType={item.mediaType}
                            voteAverage={item.voteAverage ?? 0}
                            releaseDate={item.releaseDate}
                            onClick={() => setSelectedItem({ 
                              id: item.tmdbId, 
                              mediaType: item.mediaType 
                            })}
                          />
                          <button
                            className={styles.removeButton}
                            onClick={(e) => handleRemoveItem(e, item.tmdbId)}
                            aria-label="Remove from list"
                          >
                            ✕
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                    
                    {!listDetails.items?.length && (
                      <div className={styles.emptyList}>
                        <p>This list is empty</p>
                        <Link href="/search" className={styles.searchLink}>
                          Search for content to add →
                        </Link>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    className={styles.noListSelected}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className={styles.bigIcon}>📋</span>
                    <p>Select a list to view its contents</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </main>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Create New List</h3>
            <form onSubmit={handleCreateList}>
              <div className={styles.formGroup}>
                <Label>Name</Label>
                <Input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="My Favorites"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <Label>Description (optional)</Label>
                <Textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="A collection of..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <Label>Icon</Label>
                <div className={styles.emojiPicker}>
                  {emojis.map((e) => (
                    <SelectionChip
                      key={e}
                      label={e}
                      selected={newListEmoji === e}
                      onClick={() => setNewListEmoji(e)}
                      style={{ fontSize: '1.25rem', padding: '8px 12px' }}
                    />
                  ))}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <Label>Privacy</Label>
                <SegmentedControl
                  options={[
                    { value: "private", label: "Private" },
                    { value: "public", label: "Public" }
                  ]}
                  value={newListPublic ? "public" : "private"}
                  onChange={(val) => setNewListPublic(val === "public")}
                />
              </div>
              
              <div className={styles.formActions}>
                <Button3D type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button3D>
                <Button3D type="submit" variant="primary">
                  Create List
                </Button3D>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Modal */}
      <ContentModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        id={selectedItem?.id || 0}
        mediaType={selectedItem?.mediaType || "movie"}
      />
    </>
  );
}

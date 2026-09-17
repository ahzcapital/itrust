"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Check, ExternalLink, ImagePlus, Link2, LogOut, Pencil, Plus, Share2, Users, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { formatPostDate, initials, normalizeUsername, postUrl, profileUrl } from "@/lib/social";

type Profile = { id: string; name: string | null; username: string; bio: string; location: string; image: string | null; website: string | null; createdAt: string; followers: number; following: number; posts: Post[] };
type Post = { id: string; text: string; images: string[]; createdAt: string };
function toast(message: string) { window.dispatchEvent(new CustomEvent("trustme-toast", { detail: message })); }

export default function ProfileClient() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null); const [editing, setEditing] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [text, setText] = useState(""); const [postImages, setPostImages] = useState<string[]>([]); const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { const response = await fetch("/api/profile", { cache: "no-store" }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Couldn't load your profile.");
      const postsResponse = await fetch(`/api/users/${encodeURIComponent(data.username)}`, { cache: "no-store" }); const publicData = await postsResponse.json().catch(() => ({}));
      setProfile({ ...data, followers: publicData.counts?.followers || 0, following: publicData.counts?.following || 0, posts: publicData.posts || [] });
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't load your profile."); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (status === "authenticated") load(); else if (status === "unauthenticated") setLoading(false); }, [status]);

  if (status === "loading" || loading) return <main className="profilePage"><div className="profileLoading">Loading your profile…</div></main>;
  if (!session?.user) return <main className="profilePage"><section className="profileGate"><span className="kicker">TRUST.ME</span><h1>Create your profile.</h1><p>Sign in first, then build your public identity and start publishing.</p><Link className="primary" href="/login">Sign in</Link></section></main>;
  if (!profile) return <main className="profilePage"><section className="profileGate"><h1>We couldn't load your profile.</h1><p>{error}</p><button className="primary" onClick={load}>Try again</button></section></main>;

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Couldn't save profile."); setProfile((current) => current ? { ...current, ...data } : current); setEditing(false); window.dispatchEvent(new CustomEvent("trustme-profile-updated")); toast("Profile saved"); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't save profile."); } finally { setSaving(false); }
  }

  async function upload(file: File) {
    const form = new FormData(); form.append("file", file); const response = await fetch("/api/media/upload", { method: "POST", body: form }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Couldn't upload image."); return data.url as string;
  }

  async function changeAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return; setError("");
    try { const url = await upload(file); setProfile((current) => current ? { ...current, image: url } : current); } catch (err) { setError(err instanceof Error ? err.message : "Couldn't upload image."); }
  }

  async function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 4); event.target.value = "";
    try { const urls = await Promise.all(files.map(upload)); setPostImages((current) => [...current, ...urls].slice(0, 4)); } catch (err) { setError(err instanceof Error ? err.message : "Couldn't upload image."); }
  }

  async function publish(event: FormEvent) {
    event.preventDefault(); if (!text.trim() && !postImages.length) return; setError("");
    try { const response = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.trim(), images: postImages }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Couldn't publish."); setProfile((current) => current ? { ...current, posts: [data, ...current.posts], following: current.following } : current); setText(""); setPostImages([]); toast("Published"); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't publish."); }
  }

  async function deletePost(id: string) { if (!confirm("Delete this post?")) return; const response = await fetch(`/api/posts/${encodeURIComponent(id)}`, { method: "DELETE" }); if (!response.ok) { setError("Couldn't delete this post."); return; } setProfile((current) => current ? { ...current, posts: current.posts.filter((post) => post.id !== id) } : current); toast("Post deleted"); }
  async function shareProfile() {
    if (!profile) return;
    const url = `${window.location.origin}${profileUrl(profile.username)}`;
    if (navigator.share) { await navigator.share({ title: `${profile.name || profile.username} on Trust.Me`, text: "Verified. Valuable. Yours.", url }).catch(() => undefined); }
    else { await navigator.clipboard.writeText(url); toast("Profile link copied"); }
  }

  return <main className="profilePage"><header className="profileNav"><Link className="logo" href="/">Trust<span>.</span>Me</Link><nav><Link href="/assets">Marketplace</Link><Link href="/creators">Creators</Link><Link href="/how-it-works">How it works</Link></nav><div className="profileNavActions"><Link href={profileUrl(profile.username)} target="_blank" className="profilePublicLink"><ExternalLink size={14}/> Public profile</Link><button className="profileSignout" onClick={() => signOut({ callbackUrl: "/" })}><LogOut size={15}/> Sign out</button></div></header><div className="profileShell"><section className="profileHero"><div className="profileCover"/><div className="profileAvatarWrap">{profile.image ? <img src={profile.image} alt={`${profile.name || "User"} profile`} className="profileAvatar"/> : <div className="profileAvatar profileInitials">{initials(profile.name || session.user.name || "Trust.Me")}</div>}{editing && <label className="avatarEdit"><Camera size={15}/><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={changeAvatar}/></label>}</div><div className="profileIdentity"><div className="profileTitle"><div><span className="verifiedMini"><Check size={11}/> Verified account</span><h1>{profile.name || "Your Name"}</h1><p>@{profile.username}</p></div><div className="profileHeroActions"><button className="iconButton" aria-label="Share profile" onClick={shareProfile}><Share2 size={16}/></button><button className="outlineButton" onClick={() => setEditing((x) => !x)}><Pencil size={15}/> {editing ? "Cancel" : "Edit profile"}</button></div></div><p className="profileBio">{profile.bio || "Tell people who you are and what you are interested in."}</p><p className="profileLocation">{profile.location || "Egypt"}{profile.website ? <> · <a href={profile.website} target="_blank" rel="noreferrer">{profile.website.replace(/^https?:\/\//, "")}</a></> : null}</p><div className="profileStats"><Link href={`${profileUrl(profile.username)}/followers`}><strong>{profile.followers}</strong> followers</Link><Link href={`${profileUrl(profile.username)}/following`}><strong>{profile.following}</strong> following</Link><span><strong>{profile.posts.length}</strong> posts</span></div></div></section>
        {editing && <form className="editProfileCard" onSubmit={saveProfile}><div className="editGrid"><label>Name<input value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required/></label><label>Username<input value={profile.username} onChange={(e) => setProfile({ ...profile, username: normalizeUsername(e.target.value) })} required/><small>3–20 letters, numbers or underscores.</small></label><label>Location<input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })}/></label><label>Website<input value={profile.website || ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} placeholder="https://example.com"/></label><label className="wide">Bio<textarea maxLength={180} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}/></label></div><div className="editActions"><button className="primary" type="submit" disabled={saving}><Check size={16}/> {saving ? "Saving…" : "Save profile"}</button><Link className="secondaryButton" href={profileUrl(profile.username)} target="_blank">Preview public profile</Link></div>{error && <p className="profileFormError">{error}</p>}</form>}
        {error && !editing && <p className="profileFormError">{error}</p>}
        <div className="profileTabs"><Link className="active" href="#posts">Posts</Link><Link href="#media">Media</Link><Link href="#about">About</Link></div><div className="profileContent" id="posts"><section className="profileFeed"><div className="sectionHeading"><div><span className="kicker">YOUR SPACE</span><h2>Publish something.</h2></div><button className="textAction" onClick={shareProfile}><Link2 size={14}/> Share profile</button></div><form className="composer" onSubmit={publish}><div className="composerTop"><div className="smallAvatar">{initials(profile.name || session.user.name || "T")}</div><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share an idea, an asset, an update…" maxLength={2000}/></div>{postImages.length > 0 && <div className={`postImageGrid draftGrid count-${Math.min(postImages.length, 4)}`}>{postImages.map((src, i) => <div className="draftImage" key={`${src}-${i}`}><img src={src} alt="Upload preview"/><button type="button" aria-label="Remove image" onClick={() => setPostImages(postImages.filter((_, index) => index !== i))}><X size={14}/></button></div>)}</div>}<div className="composerBottom"><label className="mediaButton"><ImagePlus size={17}/> Add photos<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={addImages}/></label><span className="characterCount">{text.length}/2000</span><button className="publishButton" type="submit" disabled={!text.trim() && !postImages.length}>Publish <Plus size={16}/></button></div></form><div className="postList">{profile.posts.length === 0 ? <div className="emptyPosts"><ImagePlus size={24}/><h3>Your first post starts here.</h3><p>Write something or add photos, then publish it for your audience.</p></div> : profile.posts.map((post) => <article className="postCard" key={post.id}><div className="postHead"><Link href={profileUrl(profile.username)}><div className="smallAvatar">{initials(profile.name || profile.username)}</div></Link><div className="postAuthor"><strong>{profile.name || profile.username} <span className="verifiedDot"><Check size={10}/></span></strong><span>@{profile.username} · <Link href={postUrl(profile.username, post.id)}>{formatPostDate(post.createdAt)}</Link></span></div><div className="postMenu"><button aria-label="Delete post" onClick={() => deletePost(post.id)}>×</button></div></div>{post.text && <p className="postText">{post.text}</p>}{post.images.length > 0 && <div className={`postImageGrid count-${Math.min(post.images.length, 4)}`} id="media">{post.images.map((src, i) => <img src={src} alt="Post media" key={`${post.id}-${i}`}/>)}</div>}</article>)}</div></section><aside className="profileSidebar"><div className="profileNote"><span>ASSET PASSPORT</span><p>Your profile is your public identity across the Trust.Me marketplace.</p></div><div className="peopleCard"><div className="sideTitle"><div><span className="kicker">NETWORK</span><h3>Build trusted relationships</h3></div><Users size={18}/></div><p>Discover members, follow people you trust and start private conversations.</p><Link href="/people" className="secondaryButton">Explore people</Link></div></aside></div></div></main>;
}

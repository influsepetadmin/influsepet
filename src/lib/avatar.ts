const AVATAR_FILES = [
  "1774459094289-92763171-b8b4-41fd-b7c1-b63a3ea10291.png",
  "1774459371126-893ff0cf-e82e-42de-a197-c9be9dff6f00.jpg",
  "1774459930714-4eb436c0-1faf-46fc-ba3a-beca124b0a66.jpg",
  "1774459946479-9237c37d-1427-4627-a715-1b5d98603ee7.jpg",
];

export function getAvatarUrl(userId: string) {
  // Deterministic: ayni userId -> ayni avatar (random yok).
  let sum = 0;
  for (let i = 0; i < userId.length; i++) sum += userId.charCodeAt(i);
  const file = AVATAR_FILES[sum % AVATAR_FILES.length] ?? AVATAR_FILES[0];
  return `/uploads/profile-images/${file}`;
}


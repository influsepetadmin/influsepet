import Link from "next/link";

export function PublicProfileNotFound({
  title = "Profil bulunamadı",
  description = "Bu kullanıcı adıyla kayıtlı bir profil yok veya profil artık yayında değil.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="public-profile-not-found">
      <div className="public-profile-not-found__card">
        <div className="public-profile-not-found__mark" aria-hidden>
          <span className="public-profile-not-found__mark-inner" />
        </div>
        <h1 className="public-profile-not-found__title">{title}</h1>
        <p className="public-profile-not-found__desc muted">{description}</p>
        <Link className="btn secondary public-profile-not-found__btn" href="/">
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}

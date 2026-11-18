import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './Avatar.css';

type Props = {
  name: string;
  photoUrl?: string | null;
  className?: string;
};

export function Avatar({ name, photoUrl, className = '' }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const initial = name.trim().charAt(0).toLocaleUpperCase();

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setImageUrl(null);

    if (photoUrl) {
      const endpoint = photoUrl.replace(/^\/api(?=\/)/, '');
      api.get<Blob>(endpoint, { responseType: 'blob' })
        .then(({ data }) => {
          objectUrl = URL.createObjectURL(data);
          if (active) setImageUrl(objectUrl);
          else URL.revokeObjectURL(objectUrl);
        })
        .catch(() => {
          if (active) setImageUrl(null);
        });
    }

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoUrl]);

  return imageUrl
    ? <img className={`avatar ${className}`} src={imageUrl} alt={`Foto de ${name}`} />
    : <div className={`avatar avatar-fallback ${className}`} aria-label={`Avatar de ${name}`}>{initial}</div>;
}

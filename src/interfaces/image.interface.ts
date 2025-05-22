export interface ImageThumbnail {
  url: string;
}

export interface ImageMedium {
  url: string;
}

export interface ImageSmall {
  url: string;
}

export interface ImageLarge {
  url: string;
}
export interface ImageFormat {
  thumbnail?: ImageThumbnail;
  medium?: ImageMedium;
  small?: ImageSmall;
  large?: ImageLarge;
}

export interface ImageInterface {
  id: number;
  name: string;
  url: string;
  formats: ImageFormat;
}

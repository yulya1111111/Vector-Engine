export interface IGalleryItem {
    id: string;
    name: string;
    date: string;
}

export interface IGalleryItemProps extends IGalleryItem {
    onOpenBtn: () => void;
    onCloseBtn: () => void;
}
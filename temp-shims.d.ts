declare namespace React {
  type ReactNode = any;
  type ElementType = any;
  type Dispatch<A> = (value: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);
  interface CSSProperties { [key: string]: any }
  interface ButtonHTMLAttributes<T> extends Record<string, any> {}
  interface InputHTMLAttributes<T> extends Record<string, any> {}
  interface TextareaHTMLAttributes<T> extends Record<string, any> {}
  interface LabelHTMLAttributes<T> extends Record<string, any> {}
  interface ChangeEvent<T = any> { target: T; }
}
declare namespace JSX {
  interface ElementChildrenAttribute { children: {}; }
  interface IntrinsicAttributes { key?: any; }
  interface IntrinsicElements { [elemName: string]: any; }
}
declare module 'react' {
  export = React;
  export function useEffect(effect: any, deps?: any): any;
  export function useMemo<T = any>(factory: () => T, deps?: any): T;
  export function useRef<T = any>(initialValue?: T): any;
  export function useState<S = any>(initialState?: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  export function forwardRef<T = any, P = any>(render: any): any;
  export const Fragment: any;
  export type ChangeEvent<T = any> = React.ChangeEvent<T>;
  export type Dispatch<A> = React.Dispatch<A>;
  export type SetStateAction<S> = React.SetStateAction<S>;
}
declare module 'react-dom' { export const createPortal: any; }
declare module 'next' {
  export type Metadata = any;
  export type Viewport = any;
}
declare module 'next/navigation' { export const useRouter: any; }
declare module 'lucide-react' {
  export const ArrowLeft:any;
  export const BarChart3:any;
  export const Bell:any;
  export const Bookmark:any;
  export const Check:any;
  export const ChevronDown:any;
  export const ChevronUp:any;
  export const Clock3:any;
  export const Heart:any;
  export const Home:any;
  export const Image:any;
  export const MessageCircle:any;
  export const MessageSquareMore:any;
  export const Mic:any;
  export const MoreHorizontal:any;
  export const Music2:any;
  export const Palette:any;
  export const Phone:any;
  export const PhoneOff:any;
  export const Pin:any;
  export const Plus:any;
  export const PlusCircle:any;
  export const Repeat2:any;
  export const Search:any;
  export const Send:any;
  export const SendHorizontal:any;
  export const Settings2:any;
  export const Share2:any;
  export const Smile:any;
  export const Trash2:any;
  export const Upload:any;
  export const UserCircle2:any;
  export const Video:any;
  export const X:any;
}

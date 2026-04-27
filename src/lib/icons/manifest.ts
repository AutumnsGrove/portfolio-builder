// Icon manifest — semantic aliases to Phosphor icon names.
// Pure data, no component imports. Add new icons here first.

export const ICON_MANIFEST = {
  nav: {
    arrowRight: "ArrowRight",
    arrowUpRight: "ArrowUpRight",
    arrowLeft: "ArrowLeft",
    chevronRight: "CaretRight",
    chevronDown: "CaretDown",
    menu: "List",
    close: "X",
    external: "ArrowSquareOut",
  },

  action: {
    plus: "Plus",
    trash: "Trash",
    edit: "PencilSimple",
    copy: "Copy",
    download: "DownloadSimple",
    upload: "UploadSimple",
    share: "ShareNetwork",
    send: "PaperPlaneRight",
    save: "FloppyDisk",
    search: "MagnifyingGlass",
    filter: "Funnel",
    settings: "GearSix",
  },

  content: {
    chatCircle: "ChatCircle",
    compass: "Compass",
    layout: "SquaresFour",
    palette: "Palette",
    image: "Image",
    text: "TextAa",
    code: "Code",
    video: "VideoCamera",
    audio: "SpeakerHigh",
    file: "File",
    folder: "Folder",
    globe: "Globe",
    rocket: "Rocket",
    sparkle: "Sparkle",
    lightbulb: "Lightbulb",
    eye: "Eye",
  },

  state: {
    check: "Check",
    checkCircle: "CheckCircle",
    warning: "Warning",
    error: "XCircle",
    info: "Info",
    spinner: "SpinnerGap",
    lock: "Lock",
  },

  auth: {
    user: "User",
    signIn: "SignIn",
    signOut: "SignOut",
  },
} as const;

export type IconGroupName = keyof typeof ICON_MANIFEST;
export type IconName<G extends IconGroupName> = keyof (typeof ICON_MANIFEST)[G];

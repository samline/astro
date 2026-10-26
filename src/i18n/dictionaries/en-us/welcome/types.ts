interface DemoFile {
  path: string
  title: string
  description: string
}

export interface Welcome {
  logoAlt: string
  title: string
  description: string
  filesTitle: string
  files: DemoFile[]
  footer: string
  demo: {
    title: string
    description: string
    structureTitle: string
    steps: DemoFile[]
  }
}

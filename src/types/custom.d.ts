import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": any;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ion-icon": any;
    }
  }
}

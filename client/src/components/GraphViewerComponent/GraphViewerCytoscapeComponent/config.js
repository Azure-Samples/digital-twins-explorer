// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable */

export const graphStyles = [ // the stylesheet for the graph
  {
    selector: "node",
    style: {
      "width": "20px",
      "height": "20px",
      "background-color": "#666",
      "label": "data(id)",
      "border-color": "#ccc",
      "border-width": 2,
      "color": "#ccc",
      "font-size": "10px",
      "font-family": "Segoe UI, sans-serif",
      "font-weight": 600,
      "text-wrap": "ellipsis",
      "text-max-width": "60px",
      "background-fit": "contain",
      "background-repeat": "no-repeat",
      "background-clip": "none"
    }
  },
  {
    selector: ":selected",
    css: {
      "border-color": "#900",
      "line-color": "#900",
      "target-arrow-color": "#900"
    }
  },
  {
    selector: "edge",
    style: {
      "curve-style": "bezier",
      "width": 1,
      "line-color": "#ccc",
      "target-arrow-color": "#ccc",
      "target-arrow-shape": "triangle",
      "arrow-scale": 0.5,
      //"mid-target-arrow-color": "#ccc",
      //"mid-target-arrow-shape": "triangle",
      "label": "data(label)",
      "color": "#777",
      "font-size": "8px",
      "font-family": "Segoe UI, sans-serif",
      "font-weight": 200,
      "text-rotation": "autorotate",
      "text-wrap": "ellipsis",
      "text-max-width": "60px",
      "text-margin-y": "-7px"
    }
  },
  {
    selector: "edge:selected",
    style: {
      "border-color": "#900",
      "line-color": "#900",
      "target-arrow-color": "#900",
      "width": 3
    }
  },
  {
    selector: "edge.highlighted",
    style: {
      "border-color": "#e9e6e6",
      "line-color": "#e9e6e6",
      "target-arrow-color": "#e9e6e6",
      "width": 2
    }
  },
  {
    selector: ".hide",
    style: {
      "display": "none"
    }
  },
  {
    selector: ".opaque",
    style: {
      "opacity": "0.4"
    }
  }
]

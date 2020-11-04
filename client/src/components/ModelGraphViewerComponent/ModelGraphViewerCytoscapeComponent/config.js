// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/* eslint-disable */

export const graphStyles = [
  // the stylesheet for the graph
  {
    selector: "node",
    style: {
      width: "80px",
      height: "20px",
      shape: "round-rectangle",
      "border-radius": "5px",
      "background-color": "#0471BD",
      label: "data(label)",
      "text-halign": "center",
      "text-valign": "center",
      color: "#ccc",
      "font-size": "10px",
      "font-family": "Segoe UI, sans-serif",
      "font-weight": 400,
      "text-wrap": "ellipsis",
      "text-max-width": "60px",
      "background-fit": "contain",
      "background-repeat": "no-repeat",
      "background-clip": "none",
    },
  },
  {
    selector: ":selected",
    css: {
      "border-color": "#900",
      "line-color": "#900",
      "target-arrow-color": "#900",
    },
  },
  {
    selector: "edge",
    style: {
      "curve-style": "bezier",
      width: 1,
      "line-color": "#ccc",
      "target-arrow-color": "#ccc",
      "source-arrow-color": "#ccc",
      "arrow-scale": 0.8,
      //"mid-target-arrow-color": "#ccc",
      //"mid-target-arrow-shape": "triangle",
      label: "data(label)",
      color: "#777",
      "font-size": "8px",
      "font-family": "Segoe UI, sans-serif",
      "font-weight": 200,
      "text-rotation": "autorotate",
      "text-wrap": "ellipsis",
      "text-max-width": "60px",
      "text-margin-y": "-7px",
    },
  },
  {
    selector: "edge:selected",
    style: {
      "border-color": "#900",
      "line-color": "#900",
      "target-arrow-color": "#900",
      "source-arrow-color": "#900",
      width: 3,
    },
  },
  {
    selector: "edge.highlighted",
    style: {
      "border-color": "#e9e6e6",
      "line-color": "#e9e6e6",
      "target-arrow-color": "#e9e6e6",
      "source-arrow-color": "#e9e6e6",
      width: 2,
    },
  },
  {
    selector: "edge.related",
    style: {
      "border-color": "#0471BD",
      "line-color": "#0471BD",
      "target-arrow-color": "#0471BD",
      "source-arrow-color": "#0471BD",
      "target-arrow-shape": "chevron",
      "arrow-scale": 1.25,
      width: 1.5
    },
  },
  {
    selector: "edge.extends",
    style: {
      "border-color": "#B70609",
      "line-color": "#B70609",
      "target-arrow-color": "#B70609",
      "source-arrow-color": "#B70609",
      "target-arrow-shape": "triangle",
      "target-arrow-fill" : "hollow",
      "arrow-scale": 1.25,
      width: 1.5
    },
  },
  {
    selector: "edge.component",
    style: {
      "border-color": "#FFB500",
      "line-color": "#FFB500",
      "target-arrow-color": "#FFB500",
      "source-arrow-color": "#FFB500",
      "source-arrow-shape": "diamond",
      "arrow-scale": 1.25,
      width: 1.5
    },
  },
  {
    selector: ".hide",
    style: {
      display: "none",
    },
  },
  {
    selector: ".opaque",
    style: {
      opacity: "0.4",
    },
  },
];

export const modelWithImageStyle = {
  "background-height": "14px",
  "background-width": "14px",
  "background-fit": "none",
  "background-position-x": "3px",
  "background-position-y": "3px",
  "text-margin-x": "3px",
  "text-max-width": "50px",
};

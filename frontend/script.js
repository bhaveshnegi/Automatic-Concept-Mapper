async function generateMindmap() {
  const text = document.getElementById("inputText").value;
  
  if (!text.trim()) {
    alert("Please enter some text to generate a mind map.");
    return;
  }

  // Update debug info
  updateDebugInfo("Status: Generating mind map...", "Text: " + text.substring(0, 50) + "...");

  // Show loading state
  const generateBtn = document.querySelector('.btn-primary');
  const originalText = generateBtn.innerHTML;
  generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
  generateBtn.disabled = true;

  try {
    const response = await fetch("http://127.0.0.1:5000/mindmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    updateDebugInfo("Status: Success! Rendering graph...", "Nodes: " + data.nodes.length + ", Edges: " + data.edges.length);
    
    // Store the generated data in localStorage
    localStorage.setItem('mindmapData', JSON.stringify(data));
    localStorage.setItem('mindmapText', text);
    
    renderGraph(data);
  } catch (error) {
    console.error("Error generating mind map:", error);
    updateDebugInfo("Status: Error - " + error.message, "Make sure backend is running at http://127.0.0.1:5000");
    alert("Error generating mind map. Please make sure your backend server is running at http://127.0.0.1:5000");
    
    // Show placeholder when there's an error
    hideGraph();
  } finally {
    // Reset button state
    generateBtn.innerHTML = originalText;
    generateBtn.disabled = false;
  }
}

function updateDebugInfo(status, data) {
  const statusEl = document.getElementById('debugStatus');
  const dataEl = document.getElementById('debugData');
  if (statusEl) statusEl.textContent = status;
  if (dataEl) dataEl.textContent = data;
}

function clearInput() {
  document.getElementById("inputText").value = "";
  hideGraph();
  // Clear stored data
  localStorage.removeItem('mindmapData');
  localStorage.removeItem('mindmapText');
  updateDebugInfo("Status: Cleared", "Data: None");
}

function hideGraph() {
  const graph = document.getElementById("graph");
  const placeholder = document.getElementById("graphPlaceholder");
  
  if (graph && placeholder) {
    graph.style.display = "none";
    placeholder.style.display = "block";
  }
}

function showGraph() {
  const graph = document.getElementById("graph");
  const placeholder = document.getElementById("graphPlaceholder");
  
  if (graph && placeholder) {
    graph.style.display = "block";
    placeholder.style.display = "none";
  }
}

function renderGraph(data) {
  console.log("Rendering graph with data:", data);
  updateDebugInfo("Status: Rendering graph...", "Processing " + data.nodes.length + " nodes");
  
  const svg = d3.select("#graph");
  if (svg.empty()) {
    console.error("SVG element not found!");
    updateDebugInfo("Status: Error - SVG not found", "Check HTML structure");
    return;
  }
  
  // Clear previous graph
  svg.selectAll("*").remove();

  // Get SVG dimensions
  const width = 800;
  const height = 600;
  
  console.log("SVG dimensions:", width, height);

  // Create a group for zoomable content
  const g = svg.append("g");

  // Enhanced zoom and pan with smooth transitions
  const zoom = d3.zoom()
    .scaleExtent([0.3, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Add zoom controls
  addZoomControls(svg, zoom);

  // Enhanced force simulation with better physics
  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.edges).id(d => d.id).distance(150).strength(0.8))
    .force("charge", d3.forceManyBody().strength(-400).distanceMax(300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => getNodeRadius(d.id) + 10))
    .force("x", d3.forceX(width / 2).strength(0.1))
    .force("y", d3.forceY(height / 2).strength(0.1));

  // Create gradient definitions for nodes
  const defs = svg.append("defs");
  
  // Create multiple gradient patterns
  const gradients = [
    { id: "grad1", colors: ["#667eea", "#764ba2"] },
    { id: "grad2", colors: ["#f093fb", "#f5576c"] },
    { id: "grad3", colors: ["#4facfe", "#00f2fe"] },
    { id: "grad4", colors: ["#43e97b", "#38f9d7"] },
    { id: "grad5", colors: ["#fa709a", "#fee140"] },
    { id: "grad6", colors: ["#a8edea", "#fed6e3"] },
    { id: "grad7", colors: ["#ffecd2", "#fcb69f"] },
    { id: "grad8", colors: ["#ff9a9e", "#fecfef"] }
  ];

  gradients.forEach((grad, i) => {
    const gradient = defs.append("linearGradient")
      .attr("id", grad.id)
      .attr("gradientUnits", "userSpaceOnUse");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", grad.colors[0]);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", grad.colors[1]);
  });

  // Create links with enhanced styling
  const link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(data.edges)
    .join("line")
    .attr("stroke", d => getLinkColor(d))
    .attr("stroke-width", 4)
    .attr("stroke-opacity", 0.7)
    .attr("stroke-linecap", "round")
    .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))");

  // Create curved links for better visual appeal
  const linkPath = g.append("g")
    .attr("class", "link-paths")
    .selectAll("path")
    .data(data.edges)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", d => getLinkColor(d))
    .attr("stroke-width", 3)
    .attr("stroke-opacity", 0.6)
    .attr("stroke-linecap", "round")
    .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.1))");

  // Create edge labels with better positioning and styling
  const edgeLabels = g.append("g")
    .attr("class", "edge-labels")
    .selectAll("text")
    .data(data.edges)
    .join("text")
    .text(d => d.label)
    .attr("font-size", 11)
    .attr("fill", "#2d3748")
    .attr("font-weight", "600")
    .attr("text-anchor", "middle")
    .attr("dy", -8)
    .style("pointer-events", "none")
    .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)");

  // Create nodes with enhanced shapes and styling
  const node = g.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(data.nodes)
    .join("g")
    .call(drag(simulation));

  // Add node shapes (circles with different styles)
  node.append("circle")
    .attr("r", d => getNodeRadius(d.id))
    .attr("fill", d => `url(#${getNodeGradient(d.id)})`)
    .attr("stroke", "#fff")
    .attr("stroke-width", 4)
    .style("filter", "drop-shadow(0 6px 20px rgba(0,0,0,0.15))")
    .style("cursor", "pointer");

  // Add inner glow effect
  node.append("circle")
    .attr("r", d => getNodeRadius(d.id) - 2)
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,0.3)")
    .attr("stroke-width", 2);

  // Create node labels with enhanced styling
  const label = node.append("text")
    .text(d => d.id)
    .attr("font-size", d => Math.max(10, Math.min(14, 12 - d.id.length * 0.2)))
    .attr("fill", "#fff")
    .attr("font-weight", "700")
    .attr("text-anchor", "middle")
    .attr("dy", 4)
    .style("pointer-events", "none")
    .style("text-shadow", "0 2px 4px rgba(0,0,0,0.5)")
    .style("font-family", "'Inter', sans-serif");

  // Add hover effects with smooth transitions
  node
    .on("mouseover", function(event, d) {
      const nodeElement = d3.select(this);
      
      // Highlight connected links
      linkPath
        .filter(l => l.source.id === d.id || l.target.id === d.id)
        .transition()
        .duration(200)
        .attr("stroke-width", 6)
        .attr("stroke-opacity", 1);

      // Enlarge node
      nodeElement.select("circle")
        .transition()
        .duration(200)
        .attr("r", getNodeRadius(d.id) + 8)
        .attr("stroke-width", 6);

      // Show tooltip
      showTooltip(event, d);
    })
    .on("mouseout", function(event, d) {
      const nodeElement = d3.select(this);
      
      // Reset links
      linkPath
        .transition()
        .duration(200)
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 0.6);

      // Reset node
      nodeElement.select("circle")
        .transition()
        .duration(200)
        .attr("r", getNodeRadius(d.id))
        .attr("stroke-width", 4);

      // Hide tooltip
      hideTooltip();
    });

  // Enhanced simulation tick function
  simulation.on("tick", () => {
    // Update straight links
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    // Update curved link paths
    linkPath.attr("d", d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.sqrt(dx * dx + dy * dy);
      
      return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    });

    // Update nodes
    node.attr("transform", d => `translate(${d.x},${d.y})`);

    // Update edge labels with better positioning
    edgeLabels
      .attr("x", d => (d.source.x + d.target.x) / 2)
      .attr("y", d => (d.source.y + d.target.y) / 2);
  });

  // Show the graph and hide placeholder
  showGraph();
  
  // Add entrance animation
  g.style("opacity", 0)
    .transition()
    .duration(800)
    .style("opacity", 1);

  // Animate nodes appearing
  node.style("opacity", 0)
    .transition()
    .delay((d, i) => i * 100)
    .duration(400)
    .style("opacity", 1);
    
  updateDebugInfo("Status: Graph rendered successfully!", "Nodes: " + data.nodes.length + ", Edges: " + data.edges.length);
}

function addZoomControls(svg, zoom) {
  const controls = svg.append("g")
    .attr("class", "zoom-controls")
    .attr("transform", "translate(20, 20)");

  // Zoom in button
  controls.append("circle")
    .attr("r", 20)
    .attr("fill", "rgba(255,255,255,0.9)")
    .attr("stroke", "#667eea")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .style("filter", "drop-shadow(0 2px 8px rgba(0,0,0,0.1))");

  controls.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 4)
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .attr("fill", "#667eea")
    .text("+")
    .style("pointer-events", "none")
    .on("click", () => zoom.scaleBy(svg.transition().duration(300), 1.5));

  // Zoom out button
  controls.append("circle")
    .attr("r", 20)
    .attr("fill", "rgba(255,255,255,0.9)")
    .attr("stroke", "#667eea")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .style("filter", "drop-shadow(0 2px 8px rgba(0,0,0,0.1))")
    .attr("transform", "translate(0, 50)");

  controls.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 4)
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .attr("fill", "#667eea")
    .text("−")
    .style("pointer-events", "none")
    .attr("transform", "translate(0, 50)");

  // Reset zoom button
  controls.append("circle")
    .attr("r", 20)
    .attr("fill", "rgba(255,255,255,0.9)")
    .attr("stroke", "#667eea")
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .style("filter", "drop-shadow(0 2px 8px rgba(0,0,0,0.1))")
    .attr("transform", "translate(0, 100)");

  controls.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", 4)
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("fill", "#667eea")
    .text("⌂")
    .style("pointer-events", "none")
    .attr("transform", "translate(0, 100)")
    .on("click", () => {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
      );
    });
}

function showTooltip(event, d) {
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.8)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
    .text(d.id);

  tooltip
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px");
}

function hideTooltip() {
  d3.selectAll(".tooltip").remove();
}

function getNodeRadius(text) {
  return Math.max(25, Math.min(50, text.length * 2 + 15));
}

function getNodeGradient(text) {
  const gradients = ["grad1", "grad2", "grad3", "grad4", "grad5", "grad6", "grad7", "grad8"];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getLinkColor(link) {
  const colors = ["#667eea", "#f093fb", "#4facfe", "#43e97b", "#fa709a", "#a8edea"];
  let hash = 0;
  const text = link.source.id + link.target.id + link.label;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function drag(simulation) {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
  console.log("Page loaded, initializing...");
  updateDebugInfo("Status: Page loaded", "Initializing...");
  
  // Check if we have stored mindmap data
  const storedData = localStorage.getItem('mindmapData');
  const storedText = localStorage.getItem('mindmapText');
  
  if (storedData && storedText) {
    console.log("Restoring stored mindmap data");
    updateDebugInfo("Status: Restoring stored data", "Found previous mindmap");
    // Restore the stored data
    document.getElementById("inputText").value = storedText;
    try {
      const data = JSON.parse(storedData);
      renderGraph(data);
    } catch (error) {
      console.error("Error restoring stored data:", error);
      localStorage.removeItem('mindmapData');
      localStorage.removeItem('mindmapText');
      hideGraph();
      updateDebugInfo("Status: Error restoring data", "Cleared corrupted data");
    }
  } else {
    console.log("No stored data, setting up sample text");
    updateDebugInfo("Status: No stored data", "Ready to generate new mindmap");
    // Set sample text
    const sampleText = "The internet connects devices worldwide. Users share data online. Hackers exploit vulnerabilities. Cybersecurity protects sensitive information. Firewalls block unauthorized access.";
    document.getElementById("inputText").value = sampleText;
    
    // Show placeholder initially
    hideGraph();
  }
});

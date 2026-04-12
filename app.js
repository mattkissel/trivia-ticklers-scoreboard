async function loadScores() {
  const response = await fetch('./scores.json')
  const data = await response.json()
  return data
}

function renderLastUpdated(date) {
  document.getElementById('last-updated').textContent = `Last updated: ${date}`
}

function renderAwardCards(data) {
    const leader = data.scores[0];

    const maxPoints = Math.max(...data.scores.map(p => p.totalPoints));
    const maxMatchesWon = leader.matchesWon;
    
    const leaders = data.scores.filter(p => p.totalPoints === maxPoints && p.matchesWon === maxMatchesWon);
    document.getElementById('leader-info').innerHTML = `${maxMatchesWon} match won, ${maxPoints} points scored`;
    const leaderHtml = document.getElementById('leader-players');
    leaderHtml.innerHTML = leaders.map(player => `
        <div class="card-player">
            ${player.name}
        </div>
    `).join(''
    );

    const pointLeaders = data.scores.filter(p => p.totalPoints === maxPoints);
    const scorerhtml = document.getElementById('top-scorers');
    document.getElementById('top-score').innerHTML = `Score: ${maxPoints}`;
    scorerhtml.innerHTML = pointLeaders.map(player => `
        <div class="card-player">
            ${player.name}
        </div>
    `).join(''
    );
    const mostTiedAmount = Math.max(...data.scores.map(p => p.matchesTied));
    const mostTiedPlayers = data.scores.filter(p => p.matchesTied === mostTiedAmount);
    document.getElementById('most-tied-count').innerHTML = `Games Tied: ${mostTiedAmount}`;
    const tiedhtml = document.getElementById('most-tied-players');
    tiedhtml.innerHTML = mostTiedPlayers.map(player => `
        <div class="card-player">
            ${player.name}
        </div>
    `).join(''
    );

    const mostWeeksSkippedAmount = Math.max(...data.scores.map(p => p.weeksSkipped));
    const slackerPlayers = data.scores.filter(p => p.weeksSkipped === mostWeeksSkippedAmount);
    document.getElementById("slacker-weeks").innerHTML = `Weeks Skipped: ${mostWeeksSkippedAmount}`;
    const slackerHtml = document.getElementById('slacker-players');
    slackerHtml.innerHTML = slackerPlayers.map(player => `
        <div class="card-player">
            ${player.name}
        </div>
    `).join(''
    );

    const mostPartialCreditAmount = Math.max(...data.scores.map(p => p.partialPointQs));
    const partialPlayers = data.scores.filter(p => p.partialPointQs === mostPartialCreditAmount);
    document.getElementById("partial-credit-count").innerHTML = `Questions with Partial Credit: ${mostPartialCreditAmount}`;
    const partialCreditHtml = document.getElementById('partial-credit');
    partialCreditHtml.innerHTML = partialPlayers.map(player => `
        <div class="card-player">
            ${player.name}
        </div>
    `).join(''
    );
    const mostPerfectQsAmount = Math.max(...data.scores.map(p => p.perfectQs));
    const perfectQPlayers = data.scores.filter(p => p.perfectQs === mostPerfectQsAmount);
    document.getElementById("perfect-answers-count").innerHTML = `Questions Perfectly Answered: ${mostPerfectQsAmount}`;
    const perfectQHtml = document.getElementById('perfect-answers-players');
    perfectQHtml.innerHTML = perfectQPlayers.map(player => `
        <div class="card-player">
            ${player.name}
        </div>
    `).join(''
    );

    const easiestQ = data.easiestQuestions[0]
    const hardestQ = data.hardestQuestions[0]

    document.getElementById('easiest-asked-count').innerHTML = `Times Asked: ${easiestQ.timesAsked}`
    document.getElementById('easiest-correct-count').innerHTML = `Times Correct: ${easiestQ.correctCount}`
    document.getElementById('easiest-question').innerHTML = `Question: ${hardestQ.question}`

    document.getElementById('hardest-asked-count').innerHTML = `Times Asked: ${hardestQ.timesAsked}`
    document.getElementById('hardest-missed-count').innerHTML = `Times Missed: ${hardestQ.missedCount}`
    document.getElementById('hardest-question').innerHTML = `Question: ${hardestQ.question}`

}

function renderStandings(scores) {
  const tbody = document.getElementById('standings-body')
  tbody.innerHTML = scores.map(player => `
    <tr>
      <td>${player.rank}</td>
      <td>${player.name}</td>
      <td>${player.matchesWon}</td>
      <td>${player.matchesTied}</td>
      <td>${player.totalPoints}</td>
    </tr>
  `).join('')
}

async function init() {
  const data = await loadScores()
  renderLastUpdated(data.lastUpdated)
  renderStandings(data.scores)
  renderAwardCards(data)
  renderBubbleChart(data.scores)
}

init()


function renderBubbleChart(scores) {
  const container = document.getElementById('bubble-chart')
  const width = container.clientWidth
  const height = Math.min(width, 500) 

  // const width =  1000
  // const height = 800


  const svg = d3.select('#bubble-svg')
    .attr('width', width)
    .attr('height', height)

  // scale bubble size to total points
  const maxPoints = d3.max(scores, p => p.totalPoints)
  const minPoints = d3.min(scores, p => p.totalPoints)

  const maxRadius = width < 400 ? 25 : 100
  const sizeScale = d3.scaleSqrt()
    .domain([minPoints, maxPoints])
    .range([10, maxRadius])
    //     .domain([minPoints, maxPoints])
    // .range([10, 80])


const winRate = d => d.matchesWon / d.matchesPlayed

const colorScale = d3.scaleSequential()
  .domain([0, 1])
  .interpolator(d3.interpolateRgb('#2d2f55', '#52d9ce'))  // red to green (solarized)
    


    
  // create a node per player
  const nodes = scores.map(d => ({
    ...d,
    r: sizeScale(d.totalPoints)
  }))

  // force simulation packs bubbles without overlap
  // const simulation = d3.forceSimulation(nodes)
  //   .force('charge', d3.forceManyBody().strength(5))
  //   .force('center', d3.forceCenter(width / 2, height / 2))
  //   .force('collision', d3.forceCollide(d => d.r + 2))
  //   .stop()

const simulation = d3.forceSimulation(nodes)
  .force('charge', d3.forceManyBody().strength(5))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide(d => d.r + 2))
  .force('x', d3.forceX(width / 2).strength(0.05))  // pull toward center x
  .force('y', d3.forceY(height / 2).strength(0.15))  // pull toward center y
  .stop()

  // run simulation synchronously
  for (let i = 0; i < 500; i++) simulation.tick()

const tooltip = d3.select('#tooltip')

svg.selectAll('circle')
  .data(nodes)
  .join('circle')
  .attr('cx', d => d.x)
  .attr('cy', d => d.y)
  .attr('r', d => d.r)
  .attr('fill', d => colorScale(winRate(d)))
  .attr('opacity', 0.85)
  .on('mouseover', (event, d) => {
    tooltip
      .style('display', 'block')
      .html(`
        <strong>${d.name}</strong><br>
        Points: ${d.totalPoints}<br>
        Won: ${d.matchesWon}<br>
        Tied: ${d.matchesTied}
      `)
  })
  .on('mousemove', (event) => {
    tooltip
      .style('left', (event.pageX + 12) + 'px')
      .style('top', (event.pageY - 28) + 'px')
  })
  .on('mouseout', () => {
    tooltip.style('display', 'none')
  })

  // hide label if bubble too small
  svg.selectAll('text')
    .data(nodes)
    .join('text')
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', d => Math.max(8, d.r / 3))
    .attr('fill', 'white')
    .attr('pointer-events', 'none')
    .style('display', d => d.r < 15 ? 'none' : 'block')
    .text(d => d.name)
}
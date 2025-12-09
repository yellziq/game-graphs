import { Node } from './Node.js'

export class Logic {
    constructor() {
        this.lastUpdate = performance.now()
        this.updateRate = 16
        
        this.update = this.update.bind(this)
        this.handleClick = this.handleClick.bind(this)
        this.handleResize = this.handleResize.bind(this)
        this.restartGame = this.restartGame.bind(this)
        
        this.canvas = document.createElement('canvas')
        this.canvas.addEventListener('contextmenu', this.handleClick)
        this.ctx = this.canvas.getContext('2d')
        
        this.restartBtn = document.createElement('button')
        this.restartBtn.textContent = '↻ Restart Level'
        this.restartBtn.className = 'restart-button'
        this.restartBtn.addEventListener('click', this.restartGame)
        
        this.nodes = []
        this.radius = 250
        this.selectedNode = null
        this.moves = 0
        this.level = 1
        this.maxLevel = 3
        this.animationProgress = 0
        
        this.resizeCanvas()
        document.body.appendChild(this.canvas)
        document.body.appendChild(this.restartBtn)
        
        window.addEventListener('click', this.handleClick)
        window.addEventListener('resize', this.handleResize)
        
        this.makeGraph()
        this.rAF = requestAnimationFrame(this.update)
        
        this.addRestartButtonStyles()
    }
    
    addRestartButtonStyles() {
        if (!document.getElementById('restart-button-styles')) {
            const style = document.createElement('style')
            style.id = 'restart-button-styles'
            style.textContent = `
                .restart-button {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(231, 76, 60, 0.9);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    font-size: 16px;
                    font-weight: bold;
                    border-radius: 25px;
                    cursor: pointer;
                    z-index: 100;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
                    font-family: 'Segoe UI', Arial;
                }
                
                .restart-button:hover {
                    background: rgba(231, 76, 60, 1);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.6);
                }
                
                .restart-button:active {
                    transform: translateY(0);
                }
            `
            document.head.appendChild(style)
        }
    }
    
    restartGame() {
        this.makeGraph()
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
    }
    
    handleResize() {
        this.resizeCanvas()
        this.makeGraph()
    }

    handleClick(e) {
        e.preventDefault()
        
        let x = e.clientX
        let y = e.clientY

        if (e.button === 0) {
            this.nodes.forEach(node => {
                if (node.wasClicked(x, y)) {
                    let selected = this.nodes.filter(n => n.isSelected)
                    let toDeselect = selected[0] ? selected[0] : null
                    if (toDeselect) toDeselect.deselect()
                    node.select()
                    this.selectedNode = node
                }
            })
        }
        else if (e.button === 2) {
            this.nodes.forEach(node => {
                if (node.wasClicked(x, y)) {
                    if (this.selectedNode && this.selectedNode.getValue() > 0 && this.selectedNode.isConnection(node)) {
                        node.incrementValue()
                        this.selectedNode.decrementValue()
                        this.moves++
                    }
                }
            })
        }
    }

    makeGraph() {
    this.nodes = []
    this.selectedNode = null
    this.moves = 0
    this.animationProgress = 0
    
    let x = this.canvas.width / 2
    let y = this.canvas.height / 2
    
    const levelConfigs = [
        { nodeCount: 8, idealValue: 2, minDegree: 2, maxDegree: 3 },
        { nodeCount: 10, idealValue: 3, minDegree: 2, maxDegree: 4 },
        { nodeCount: 12, idealValue: 3, minDegree: 2, maxDegree: 4 }
    ]
    
    const config = levelConfigs[this.level - 1]
    
    // ВАЖНО: targetSum всегда вычисляется как сумма всех idealValue
    config.targetSum = config.nodeCount * config.idealValue
    
    let angle = 360 / config.nodeCount
    
    // Создаём узлы по кругу
    for(let i = 0; i < config.nodeCount; i++) {
        let nX = x + this.radius * Math.cos((angle * i) * Math.PI / 180)
        let nY = y + this.radius * Math.sin((angle * i) * Math.PI / 180)
        this.nodes.push(new Node(i, this.ctx, nX, nY, config.idealValue))
    }
    
    // Генерируем случайный связный граф
    this.generateConnectedGraph(config)
    
    // Устанавливаем начальное значение на случайном узле
    let initialNode = Math.floor(Math.random() * config.nodeCount)
    this.nodes[initialNode].setValue(config.targetSum)
}


    generateConnectedGraph(config) {
        const n = config.nodeCount
        const adjMatrix = Array(n).fill(0).map(() => Array(n).fill(false))
        
        // Шаг 1: Создаём минимальное остовное дерево для гарантии связности
        const visited = new Set([0])
        const unvisited = new Set(Array.from({length: n}, (_, i) => i).slice(1))
        
        while(unvisited.size > 0) {
            let from = Array.from(visited)[Math.floor(Math.random() * visited.size)]
            let to = Array.from(unvisited)[Math.floor(Math.random() * unvisited.size)]
            
            if (!adjMatrix[from][to]) {
                adjMatrix[from][to] = true
                adjMatrix[to][from] = true
                this.nodes[from].addConnection(this.nodes[to])
                this.nodes[to].addConnection(this.nodes[from])
            }
            
            visited.add(to)
            unvisited.delete(to)
        }
        
        // Шаг 2: Добавляем дополнительные рёбра для интересности
        const targetEdges = Math.floor(n * 1.4) // Примерно 1.4 * n рёбер
        let currentEdges = n - 1 // Уже есть n-1 рёбер от spanning tree
        
        let attempts = 0
        const maxAttempts = n * n
        
        while(currentEdges < targetEdges && attempts < maxAttempts) {
            attempts++
            let i = Math.floor(Math.random() * n)
            let j = Math.floor(Math.random() * n)
            
            if(i === j || adjMatrix[i][j]) continue
            
            // Проверяем степень узлов
            let degreeI = adjMatrix[i].filter(x => x).length
            let degreeJ = adjMatrix[j].filter(x => x).length
            
            if(degreeI < config.maxDegree && degreeJ < config.maxDegree) {
                // Избегаем соседних узлов на круге для эстетики
                let distance = Math.min(Math.abs(i - j), n - Math.abs(i - j))
                if(distance > 1) {
                    adjMatrix[i][j] = true
                    adjMatrix[j][i] = true
                    this.nodes[i].addConnection(this.nodes[j])
                    this.nodes[j].addConnection(this.nodes[i])
                    currentEdges++
                }
            }
        }
    }

    nextLevel() {
        if (this.level < this.maxLevel) {
            this.level++
            this.makeGraph()
        } else {
            this.animationProgress = 1
        }
    }

    update() {
        let now = performance.now()
        let deltaTime = now - this.lastUpdate
        
        if (deltaTime >= this.updateRate) {
            this.lastUpdate = now
            
            let gradient = this.ctx.createRadialGradient(
                this.canvas.width/2, this.canvas.height/2, 0,
                this.canvas.width/2, this.canvas.height/2, this.canvas.width/2
            )
            gradient.addColorStop(0, '#1a1a2e')
            gradient.addColorStop(1, '#0f0f1e')
            this.ctx.fillStyle = gradient
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
            
            this.nodes.forEach(node => {
                node.drawConnections()
            })
            
            let playerWon = true
            this.nodes.forEach(node => {
                if (playerWon) {
                    playerWon = node.isSatisfied()
                }
                node.draw()
            })
            
            this.drawUI(playerWon)
            
            if (playerWon && this.animationProgress < 1) {
                this.animationProgress += 0.02
                if (this.animationProgress >= 1 && this.level < this.maxLevel) {
                    setTimeout(() => this.nextLevel(), 1500)
                }
            }
        }
        this.rAF = requestAnimationFrame(this.update)
    }
    
    drawUI(playerWon) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        this.ctx.font = "bold 24px 'Segoe UI', Arial"
        this.ctx.fillText(`Level ${this.level}/${this.maxLevel}`, 30, 40)
        this.ctx.fillText(`Moves: ${this.moves}`, 30, 70)
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        this.ctx.font = "16px 'Segoe UI', Arial"
        this.ctx.fillText("Left Click: select  |  Right Click: transfer", 30, this.canvas.height - 30)
        this.ctx.fillText("Goal: Make all nodes green", 30, this.canvas.height - 10)
        
        if (playerWon) {
            this.ctx.save()
            this.ctx.globalAlpha = Math.min(this.animationProgress, 1)
            
            this.ctx.shadowBlur = 20
            this.ctx.shadowColor = '#4ecca3'
            
            this.ctx.fillStyle = '#4ecca3'
            this.ctx.font = "bold 72px 'Segoe UI', Arial"
            let text = this.level === this.maxLevel ? "All Levels Complete!" : "Level Complete!"
            let textWidth = this.ctx.measureText(text).width
            let winX = (this.canvas.width - textWidth) / 2
            let winY = this.canvas.height * 0.15
            
            this.ctx.fillText(text, winX, winY)
            
            this.ctx.restore()
        }
    }
}

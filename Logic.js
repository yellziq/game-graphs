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
        
        // Create restart button
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
        
        // Add restart button styles
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
        
        const configs = [
            {
                nodeCount: 8,
                initialNode: 0,
                initialValue: 16,
                idealValue: 2,
                connections: [
                    [0,1], [1,0], [0,4], [4,0], [0,5], [5,0],
                    [1,5], [5,1], [2,6], [6,2], [3,4], [4,3],
                    [3,6], [6,3], [3,7], [7,3]
                ]
            },
            {
                nodeCount: 10,
                initialNode: 0,
                initialValue: 30,
                idealValue: 3,
                connections: [
                    [0,1], [1,0], [0,2], [2,0], [1,3], [3,1],
                    [2,3], [3,2], [3,4], [4,3], [4,5], [5,4],
                    [4,6], [6,4], [5,7], [7,5], [6,8], [8,6],
                    [7,9], [9,7], [8,9], [9,8]
                ]
            },
            {
                nodeCount: 12,
                initialNode: 0,
                initialValue: 36,
                idealValue: 3,
                connections: [
                    [0,1], [1,0], [0,11], [11,0], [1,2], [2,1],
                    [2,3], [3,2], [3,4], [4,3], [4,5], [5,4],
                    [5,6], [6,5], [6,7], [7,6], [7,8], [8,7],
                    [8,9], [9,8], [9,10], [10,9], [10,11], [11,10],
                    [0,6], [6,0], [3,9], [9,3]
                ]
            }
        ]
        
        const config = configs[this.level - 1]
        let angle = 360 / config.nodeCount
        
        for(let i = 0; i < config.nodeCount; i++) {
            let nX = x + this.radius * Math.cos((angle * i) * Math.PI / 180)
            let nY = y + this.radius * Math.sin((angle * i) * Math.PI / 180)
            this.nodes.push(new Node(i, this.ctx, nX, nY, config.idealValue))
        }
        
        config.connections.forEach(([from, to]) => {
            this.nodes[from].addConnection(this.nodes[to])
        })
        
        this.nodes[config.initialNode].setValue(config.initialValue)
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

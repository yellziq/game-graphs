export class Node {
    constructor(id, ctx, x, y, ideal) {
        this.id = id
        this.ctx = ctx
        this.x = x
        this.y = y
        this.size = 50
        this.connections = []
        this.value = 0
        this.idealValue = ideal
        this.isSelected = false
        this.pulse = 0
    }

    draw() {
        this.drawNode()
    }
    
    drawConnections() {
        this.connections.forEach(connection => {
            this.drawConnection(connection)
        })
    }

    getId() {
        return this.id
    }
    
    getX() {
        return this.x
    }
    
    getY() {
        return this.y
    }

    setFill() {
        let ratio = this.value / this.idealValue
        
        if(ratio < 0.33) {
            return '#e74c3c' // Red
        } else if(ratio >= 0.33 && ratio < 0.66) {
            return '#e67e22' // Orange
        } else if(ratio >= 0.66 && ratio < 1) {
            return '#f39c12' // Yellow
        } else if(ratio === 1) {
            return '#2ecc71' // Green
        } else {
            return '#9b59b6' // Purple
        }
    }
    
    addConnection(connection) {
        this.connections.push(connection)
    }

    isConnection(node) {
        return this.connections.filter(c => c.getId() === node.getId()).length === 1
    }
    
    drawNode() {
        let centerX = this.x + this.size / 2
        let centerY = this.y + this.size / 2
        
        // Pulse animation
        this.pulse += 0.05
        let pulseSize = this.isSelected ? Math.sin(this.pulse) * 5 : 0
        
        // Shadow
        this.ctx.shadowBlur = 15
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        
        // Node circle
        this.ctx.fillStyle = this.setFill()
        this.ctx.beginPath()
        this.ctx.arc(centerX, centerY, (this.size / 2) + pulseSize, 0, Math.PI * 2)
        this.ctx.fill()
        
        // Selection ring
        if (this.isSelected) {
            this.ctx.strokeStyle = '#ffffff'
            this.ctx.lineWidth = 4
            this.ctx.beginPath()
            this.ctx.arc(centerX, centerY, (this.size / 2) + 8 + pulseSize, 0, Math.PI * 2)
            this.ctx.stroke()
        }
        
        this.ctx.shadowBlur = 0
        
        // Value text
        this.ctx.fillStyle = '#ffffff'
        this.ctx.font = "bold 20px 'Segoe UI', Arial"
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(this.value, centerX, centerY)
        
        // Target value indicator
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        this.ctx.font = "12px 'Segoe UI', Arial"
        this.ctx.fillText(`/${this.idealValue}`, centerX, centerY + 20)
    }

    drawConnection(connection) {
        this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.moveTo(this.x + (this.size / 2), this.y + (this.size / 2))
        this.ctx.lineTo(connection.getX() + (this.size / 2), connection.getY() + (this.size / 2))
        this.ctx.stroke()
    }

    getValue() {
        return this.value
    }

    setValue(val) {
        this.value = val
    }

    isSatisfied() {
        return this.value / this.idealValue === 1
    }
    
    incrementValue() {
        this.value += 1
    }

    decrementValue() {
        this.value -= 1
    }

    deselect() {
        this.isSelected = false
    }

    select() {
        this.isSelected = true
    }

    wasClicked(x, y) {
        let centerX = this.x + this.size / 2
        let centerY = this.y + this.size / 2
        let distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        return distance <= this.size / 2
    }
}

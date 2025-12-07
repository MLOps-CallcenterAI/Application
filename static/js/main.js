document.addEventListener('DOMContentLoaded', function() {
    const chatHistory = document.getElementById('chatHistory');
    const userInput = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    const clearBtn = document.getElementById('clearBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Check agent health on load
    checkAgentHealth();

    // Add user message to chat
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.innerHTML = '<span>You</span><span>Just now</span>';
        
        const messageText = document.createElement('p');
        messageText.textContent = text;
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(messageText);
        chatHistory.appendChild(messageDiv);
        
        // Scroll to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Add bot message to chat with Router Agent response
    function addBotMessage(response) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        
        // Get model info from Router Agent response
        const modelType = response.model_used || 'unknown';
        const modelName = modelType === 'tfidf' ? 'TF-IDF + SVM' : 
                         modelType === 'transformer' ? 'Transformer' : 'Unknown Model';
        const modelClass = modelType === 'tfidf' ? 'tfidf-model' : 'transformer-model';
        
        headerDiv.innerHTML = `
            <span>CallCenterAI <span class="model-info ${modelClass}">${modelName}</span></span>
            <span>Just now</span>
        `;
        
        const messageText = document.createElement('p');
        messageText.innerHTML = `✅ <strong>Ticket Classification Complete</strong><br>Category: <strong>${response.prediction}</strong>`;
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(messageText);
        
        // Add category tag
        if (response.prediction) {
            const categoryTag = document.createElement('div');
            categoryTag.className = 'category-tag';
            categoryTag.innerHTML = `📂 ${response.prediction}`;
            messageDiv.appendChild(categoryTag);
        }
        
        // Add actual confidence from Router Agent
        const confidence = response.confidence || 0.85;
        
        const confidenceContainer = document.createElement('div');
        confidenceContainer.style.marginTop = '12px';
        
        const confidenceLabel = document.createElement('div');
        confidenceLabel.style.fontSize = '0.8rem';
        confidenceLabel.style.marginBottom = '5px';
        confidenceLabel.style.color = 'var(--secondary-color)';
        confidenceLabel.style.fontWeight = '500';
        confidenceLabel.textContent = `Confidence Score: ${(confidence * 100).toFixed(1)}%`;
        
        const confidenceBar = document.createElement('div');
        confidenceBar.className = 'confidence-bar';
        
        const confidenceFill = document.createElement('div');
        confidenceFill.className = 'confidence-fill';
        confidenceFill.style.width = `${confidence * 100}%`;
        
        // Color based on confidence
        if (confidence >= 0.9) {
            confidenceFill.style.backgroundColor = 'var(--success-color)';
        } else if (confidence >= 0.75) {
            confidenceFill.style.backgroundColor = 'var(--primary-color)';
        } else {
            confidenceFill.style.backgroundColor = 'var(--warning-color)';
        }
        
        confidenceBar.appendChild(confidenceFill);
        confidenceContainer.appendChild(confidenceLabel);
        confidenceContainer.appendChild(confidenceBar);
        messageDiv.appendChild(confidenceContainer);
        
        // Add routing reasoning from Router Agent
        if (response.reasoning) {
            const reasoningDiv = document.createElement('div');
            reasoningDiv.style.fontSize = '0.8rem';
            reasoningDiv.style.marginTop = '15px';
            reasoningDiv.style.padding = '12px';
            reasoningDiv.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
            reasoningDiv.style.borderLeft = '3px solid var(--primary-color)';
            reasoningDiv.style.borderRadius = '4px';
            reasoningDiv.style.color = 'var(--dark-color)';
            reasoningDiv.style.lineHeight = '1.5';
            
            const reasoningTitle = document.createElement('div');
            reasoningTitle.style.fontWeight = '600';
            reasoningTitle.style.marginBottom = '6px';
            reasoningTitle.style.color = 'var(--primary-color)';
            reasoningTitle.textContent = '🎯 Routing Decision:';
            
            const reasoningText = document.createElement('div');
            reasoningText.textContent = response.reasoning;
            
            reasoningDiv.appendChild(reasoningTitle);
            reasoningDiv.appendChild(reasoningText);
            messageDiv.appendChild(reasoningDiv);
        }
        
        // Add metrics row (complexity & processing time)
        const metricsRow = document.createElement('div');
        metricsRow.style.display = 'flex';
        metricsRow.style.gap = '15px';
        metricsRow.style.marginTop = '12px';
        metricsRow.style.fontSize = '0.8rem';
        metricsRow.style.color = 'var(--secondary-color)';
        
        if (response.complexity_score !== undefined) {
            const complexityDiv = document.createElement('div');
            complexityDiv.style.display = 'flex';
            complexityDiv.style.alignItems = 'center';
            complexityDiv.style.gap = '5px';
            
            const complexityColor = response.complexity_score >= 0.5 ? '#f59e0b' : '#10b981';
            complexityDiv.innerHTML = `
                <span style="font-weight: 500;">📊 Complexity:</span>
                <span style="color: ${complexityColor}; font-weight: 600;">${response.complexity_score.toFixed(2)}</span>
            `;
            metricsRow.appendChild(complexityDiv);
        }
        
        if (response.processing_time) {
            const timeDiv = document.createElement('div');
            timeDiv.style.display = 'flex';
            timeDiv.style.alignItems = 'center';
            timeDiv.style.gap = '5px';
            timeDiv.innerHTML = `
                <span style="font-weight: 500;">⚡ Processing:</span>
                <span style="font-weight: 600;">${response.processing_time.toFixed(2)}s</span>
            `;
            metricsRow.appendChild(timeDiv);
        }
        
        if (metricsRow.children.length > 0) {
            messageDiv.appendChild(metricsRow);
        }
        
        // Add detailed complexity analysis (collapsible)
        if (response.complexity_details) {
            const detailsContainer = document.createElement('div');
            detailsContainer.style.marginTop = '15px';
            
            const detailsToggle = document.createElement('button');
            detailsToggle.style.fontSize = '0.8rem';
            detailsToggle.style.padding = '8px 12px';
            detailsToggle.style.backgroundColor = 'white';
            detailsToggle.style.border = '1px solid #e2e8f0';
            detailsToggle.style.borderRadius = '6px';
            detailsToggle.style.cursor = 'pointer';
            detailsToggle.style.color = 'var(--primary-color)';
            detailsToggle.style.fontWeight = '500';
            detailsToggle.style.transition = 'all 0.2s';
            detailsToggle.innerHTML = '📈 View Detailed Analysis';
            
            const detailsDiv = document.createElement('div');
            detailsDiv.style.display = 'none';
            detailsDiv.style.fontSize = '0.8rem';
            detailsDiv.style.marginTop = '10px';
            detailsDiv.style.padding = '15px';
            detailsDiv.style.backgroundColor = '#f8fafc';
            detailsDiv.style.borderRadius = '6px';
            detailsDiv.style.border = '1px solid #e2e8f0';
            detailsDiv.style.lineHeight = '1.8';
            
            const details = response.complexity_details;
            
            let detailsHTML = '<div style="font-weight: 600; margin-bottom: 10px; color: var(--dark-color);">🔍 Complexity Breakdown:</div>';
            
            detailsHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">';
            
            if (details.word_count !== undefined) {
                detailsHTML += `
                    <div style="padding: 8px; background: white; border-radius: 4px;">
                        <span style="color: var(--secondary-color);">📝 Word Count:</span>
                        <span style="font-weight: 600; color: var(--dark-color); margin-left: 5px;">${details.word_count}</span>
                    </div>
                `;
            }
            
            if (details.technical_terms !== undefined) {
                detailsHTML += `
                    <div style="padding: 8px; background: white; border-radius: 4px;">
                        <span style="color: var(--secondary-color);">🔧 Technical Terms:</span>
                        <span style="font-weight: 600; color: var(--dark-color); margin-left: 5px;">${details.technical_terms}</span>
                    </div>
                `;
            }
            
            if (details.language) {
                const languageNames = {
                    'en': 'English',
                    'fr': 'French',
                    'ar': 'Arabic'
                };
                detailsHTML += `
                    <div style="padding: 8px; background: white; border-radius: 4px;">
                        <span style="color: var(--secondary-color);">🌍 Language:</span>
                        <span style="font-weight: 600; color: var(--dark-color); margin-left: 5px;">${languageNames[details.language] || details.language}</span>
                    </div>
                `;
            }
            
            if (details.avg_sentence_length !== undefined) {
                detailsHTML += `
                    <div style="padding: 8px; background: white; border-radius: 4px;">
                        <span style="color: var(--secondary-color);">📏 Avg Sentence:</span>
                        <span style="font-weight: 600; color: var(--dark-color); margin-left: 5px;">${details.avg_sentence_length.toFixed(1)} words</span>
                    </div>
                `;
            }
            
            detailsHTML += '</div>';
            
            // Add special indicators
            const indicators = [];
            if (details.has_code_snippets) indicators.push('💻 Contains Code/Config');
            if (details.has_error_logs) indicators.push('⚠️ Contains Error Logs');
            
            if (indicators.length > 0) {
                detailsHTML += '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">';
                detailsHTML += '<div style="font-weight: 600; margin-bottom: 6px; color: var(--dark-color);">Special Indicators:</div>';
                indicators.forEach(indicator => {
                    detailsHTML += `<div style="margin: 4px 0; color: var(--secondary-color);">• ${indicator}</div>`;
                });
                detailsHTML += '</div>';
            }
            
            detailsDiv.innerHTML = detailsHTML;
            
            detailsToggle.addEventListener('click', function() {
                if (detailsDiv.style.display === 'none') {
                    detailsDiv.style.display = 'block';
                    detailsToggle.innerHTML = '📈 Hide Detailed Analysis';
                    detailsToggle.style.backgroundColor = '#f1f5f9';
                } else {
                    detailsDiv.style.display = 'none';
                    detailsToggle.innerHTML = '📈 View Detailed Analysis';
                    detailsToggle.style.backgroundColor = 'white';
                }
            });
            
            detailsToggle.addEventListener('mouseenter', function() {
                this.style.borderColor = 'var(--primary-color)';
                this.style.transform = 'translateY(-1px)';
            });
            
            detailsToggle.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e2e8f0';
                this.style.transform = 'translateY(0)';
            });
            
            detailsContainer.appendChild(detailsToggle);
            detailsContainer.appendChild(detailsDiv);
            messageDiv.appendChild(detailsContainer);
        }
        
        chatHistory.appendChild(messageDiv);
        
        // Scroll to bottom with smooth animation
        chatHistory.scrollTo({
            top: chatHistory.scrollHeight,
            behavior: 'smooth'
        });
    }

    // Check Router Agent health
    async function checkAgentHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            const statusIndicator = document.querySelector('.status-indicator');
            const statusText = document.querySelector('.status span');
            
            if (data.status === 'healthy') {
                statusIndicator.style.backgroundColor = 'var(--success-color)';
                statusIndicator.style.boxShadow = '0 0 8px var(--success-color)';
                statusText.textContent = '✓ Router Agent Online';
                statusText.style.color = 'var(--success-color)';
            } else {
                statusIndicator.style.backgroundColor = 'var(--danger-color)';
                statusIndicator.style.boxShadow = '0 0 8px var(--danger-color)';
                statusText.textContent = '✗ Router Agent Offline';
                statusText.style.color = 'var(--danger-color)';
            }
        } catch (error) {
            console.error('Health check failed:', error);
            const statusIndicator = document.querySelector('.status-indicator');
            const statusText = document.querySelector('.status span');
            statusIndicator.style.backgroundColor = 'var(--danger-color)';
            statusIndicator.style.boxShadow = '0 0 8px var(--danger-color)';
            statusText.textContent = '✗ Connection Error';
            statusText.style.color = 'var(--danger-color)';
        }
    }

    // Handle form submission
    submitBtn.addEventListener('click', async function() {
        const text = userInput.value.trim();
        
        if (!text) {
            // Shake animation for empty input
            userInput.style.animation = 'shake 0.5s';
            setTimeout(() => {
                userInput.style.animation = '';
            }, 500);
            return;
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'block';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
        
        // Add user message to chat
        addUserMessage(text);
        
        try {
            // Send request to Flask backend (which calls Router Agent)
            const response = await fetch('/api/prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: text }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Add bot response to chat
            addBotMessage(data);
            
            // Clear input
            userInput.value = '';
            userInput.style.height = 'auto';
        } catch (error) {
            console.error('Error:', error);
            
            // Add error message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';
            messageDiv.style.backgroundColor = '#fee2e2';
            messageDiv.style.borderLeft = '4px solid var(--danger-color)';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';
            headerDiv.innerHTML = '<span>⚠️ CallCenterAI - Error</span><span>Just now</span>';
            
            const messageText = document.createElement('p');
            messageText.innerHTML = `<strong>Connection Error</strong><br>${error.message}`;
            
            const troubleshootDiv = document.createElement('div');
            troubleshootDiv.style.marginTop = '10px';
            troubleshootDiv.style.padding = '10px';
            troubleshootDiv.style.backgroundColor = 'white';
            troubleshootDiv.style.borderRadius = '4px';
            troubleshootDiv.style.fontSize = '0.8rem';
            troubleshootDiv.innerHTML = `
                <strong>Troubleshooting:</strong><br>
                • Ensure Router Agent is running on <code>http://localhost:8000</code><br>
                • Check if TF-IDF service is running on port 8001<br>
                • Check if Transformer service is running on port 8002<br>
                • Verify network connectivity
            `;
            
            messageDiv.appendChild(headerDiv);
            messageDiv.appendChild(messageText);
            messageDiv.appendChild(troubleshootDiv);
            chatHistory.appendChild(messageDiv);
            
            // Scroll to bottom
            chatHistory.scrollTop = chatHistory.scrollHeight;
        } finally {
            // Hide loading indicator
            loadingIndicator.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    });

    // Handle clear button
    clearBtn.addEventListener('click', function() {
        userInput.value = '';
        userInput.style.height = 'auto';
        userInput.focus();
    });

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Allow submitting with Ctrl+Enter
    userInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            submitBtn.click();
        }
    });

    // Example messages with diverse complexity
    function addExampleMessage() {
        const examples = [
            {
                text: "I forgot my password and need to reset it",
                label: "Simple → TF-IDF",
                icon: "🔑"
            },
            {
                text: "After migrating our platform to microservices architecture, the OAuth integration with our identity provider fails intermittently during high-traffic periods with handshake_timeout errors",
                label: "Complex → Transformer",
                icon: "🚀"
            },
            {
                text: "Need help configuring TLS 1.3 encryption with AES-256-GCM cipher for our API gateway deployment",
                label: "Technical → Transformer",
                icon: "🔐"
            },
            {
                text: "Can't access my email account since this morning",
                label: "Simple → TF-IDF",
                icon: "📧"
            }
        ];
        
        const examplesDiv = document.createElement('div');
        examplesDiv.className = 'message bot-message';
        examplesDiv.style.maxWidth = '100%';
        examplesDiv.style.backgroundColor = '#f8fafc';
        examplesDiv.style.border = '2px dashed #e2e8f0';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.innerHTML = '<span>💡 Example Tickets</span><span>Try these</span>';
        
        const descDiv = document.createElement('p');
        descDiv.style.marginBottom = '15px';
        descDiv.textContent = 'Click any example below to see how the router handles different complexity levels:';
        
        examplesDiv.appendChild(headerDiv);
        examplesDiv.appendChild(descDiv);
        
        const examplesContainer = document.createElement('div');
        examplesContainer.style.display = 'flex';
        examplesContainer.style.flexDirection = 'column';
        examplesContainer.style.gap = '10px';
        
        examples.forEach(example => {
            const exampleBtn = document.createElement('button');
            exampleBtn.className = 'example-btn';
            exampleBtn.style.textAlign = 'left';
            exampleBtn.style.padding = '12px 15px';
            exampleBtn.style.background = 'white';
            exampleBtn.style.border = '1px solid #e2e8f0';
            exampleBtn.style.borderRadius = '8px';
            exampleBtn.style.cursor = 'pointer';
            exampleBtn.style.transition = 'all 0.2s';
            exampleBtn.style.position = 'relative';
            
            exampleBtn.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 1.5rem;">${example.icon}</span>
                    <div style="flex: 1;">
                        <div style="font-weight: 500; color: var(--dark-color); margin-bottom: 4px; line-height: 1.4;">${example.text}</div>
                        <div style="font-size: 0.75rem; color: var(--secondary-color); font-weight: 500;">${example.label}</div>
                    </div>
                </div>
            `;
            
            exampleBtn.addEventListener('click', function() {
                userInput.value = example.text;
                userInput.focus();
                userInput.style.height = 'auto';
                userInput.style.height = (userInput.scrollHeight) + 'px';
                
                // Smooth scroll to input
                userInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            
            exampleBtn.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f8fafc';
                this.style.borderColor = 'var(--primary-color)';
                this.style.transform = 'translateX(4px)';
                this.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.1)';
            });
            
            exampleBtn.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'white';
                this.style.borderColor = '#e2e8f0';
                this.style.transform = 'translateX(0)';
                this.style.boxShadow = 'none';
            });
            
            examplesContainer.appendChild(exampleBtn);
        });
        
        examplesDiv.appendChild(examplesContainer);
        chatHistory.appendChild(examplesDiv);
        
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    // Add CSS for shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
    
    // Add example messages after initial bot message
    setTimeout(addExampleMessage, 1500);
    
    // Refresh health status every 30 seconds
    setInterval(checkAgentHealth, 30000);
    
    // Focus on input on page load
    userInput.focus();
});
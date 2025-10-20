"""
Oliver-OS Voice Processor Service
Speech-to-text and voice command processing
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
import base64
import io

# Speech processing imports
try:
    import speech_recognition as sr
    import whisper
    SPEECH_AVAILABLE = True
except ImportError:
    SPEECH_AVAILABLE = False
    logging.warning("Speech processing libraries not available")

try:
    from pydub import AudioSegment
    AUDIO_PROCESSING_AVAILABLE = True
except ImportError:
    AUDIO_PROCESSING_AVAILABLE = False
    logging.warning("Audio processing not available")

# Local imports
from config.settings import Settings

logger = logging.getLogger(__name__)


class VoiceProcessor:
    """
    Voice processing service for speech-to-text and voice commands
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = logging.getLogger('VoiceProcessor')
        
        # Initialize speech recognition
        self._initialize_speech_recognition()
        
        # Voice command patterns
        self.command_patterns = {
            "create_thought": ["create thought", "new thought", "add thought"],
            "search": ["search for", "find", "look for"],
            "analyze": ["analyze", "examine", "review"],
            "collaborate": ["collaborate", "share", "work together"],
            "spawn_agent": ["spawn agent", "create agent", "new agent"]
        }
    
    def _initialize_speech_recognition(self):
        """Initialize speech recognition components"""
        if not SPEECH_AVAILABLE:
            self.logger.warning("⚠️ Speech recognition not available")
            self.recognizer = None
            self.whisper_model = None
            return
        
        try:
            # Initialize speech recognizer
            self.recognizer = sr.Recognizer()
            self.recognizer.energy_threshold = 300
            self.recognizer.dynamic_energy_threshold = True
            self.recognizer.pause_threshold = 0.8
            
            # Initialize Whisper model
            self.whisper_model = whisper.load_model("base")
            
            self.logger.info("✅ Speech recognition initialized")
            
        except Exception as e:
            self.logger.error(f"❌ Speech recognition initialization failed: {e}")
            self.recognizer = None
            self.whisper_model = None
    
    async def transcribe(self, audio_data: bytes) -> Dict[str, Any]:
        """
        Transcribe audio data to text
        """
        try:
            self.logger.info("🎤 Transcribing audio data")
            
            if not SPEECH_AVAILABLE or not self.recognizer:
                return await self._fallback_transcription(audio_data)
            
            # Convert bytes to audio file
            audio_file = io.BytesIO(audio_data)
            
            # Try different recognition methods
            transcription_result = None
            
            # Method 1: Google Speech Recognition
            try:
                with sr.AudioFile(audio_file) as source:
                    audio = self.recognizer.record(source)
                    transcription_result = self.recognizer.recognize_google(audio)
                    method = "google"
            except Exception as e:
                self.logger.warning(f"Google recognition failed: {e}")
            
            # Method 2: Whisper (if Google fails)
            if not transcription_result and self.whisper_model:
                try:
                    audio_file.seek(0)
                    # Save to temporary file for Whisper
                    import tempfile
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                        temp_file.write(audio_data)
                        temp_file.flush()
                        
                        result = self.whisper_model.transcribe(temp_file.name)
                        transcription_result = result["text"]
                        method = "whisper"
                        
                        # Clean up temp file
                        import os
                        os.unlink(temp_file.name)
                        
                except Exception as e:
                    self.logger.warning(f"Whisper recognition failed: {e}")
            
            if not transcription_result:
                return await self._fallback_transcription(audio_data)
            
            # Process the transcription
            processed_text = self._process_transcription(transcription_result)
            
            # Detect voice commands
            commands = self._detect_voice_commands(processed_text)
            
            result = {
                "transcription": processed_text,
                "original_text": transcription_result,
                "method": method,
                "confidence": 0.8,  # Placeholder confidence
                "commands": commands,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"✅ Transcription completed: {len(processed_text)} characters")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Error transcribing audio: {e}")
            return {
                "transcription": "",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def transcribe_bytes(self, audio_bytes: Union[bytes, str]) -> str:
        """
        Transcribe audio bytes and return just the text
        """
        try:
            # Handle base64 encoded audio
            if isinstance(audio_bytes, str):
                audio_data = base64.b64decode(audio_bytes)
            else:
                audio_data = audio_bytes
            
            result = await self.transcribe(audio_data)
            return result.get("transcription", "")
            
        except Exception as e:
            self.logger.error(f"Error transcribing bytes: {e}")
            return ""
    
    async def process_voice_command(self, command: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process voice commands and return appropriate actions
        """
        try:
            self.logger.info(f"🎯 Processing voice command: {command}")
            
            command_lower = command.lower()
            detected_commands = self._detect_voice_commands(command)
            
            if not detected_commands:
                return {
                    "command": "unknown",
                    "action": "none",
                    "message": "No valid command detected",
                    "confidence": 0.0
                }
            
            # Process the most confident command
            primary_command = max(detected_commands, key=lambda x: x.get("confidence", 0))
            
            # Generate action based on command
            action = await self._generate_command_action(primary_command, context)
            
            result = {
                "command": primary_command["type"],
                "action": action,
                "confidence": primary_command["confidence"],
                "all_commands": detected_commands,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"✅ Voice command processed: {primary_command['type']}")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Error processing voice command: {e}")
            return {
                "command": "error",
                "action": "none",
                "error": str(e),
                "confidence": 0.0
            }
    
    def _process_transcription(self, text: str) -> str:
        """
        Process and clean up transcription text
        """
        if not text:
            return ""
        
        # Basic text cleaning
        processed = text.strip()
        
        # Remove extra whitespace
        processed = " ".join(processed.split())
        
        # Capitalize first letter
        if processed:
            processed = processed[0].upper() + processed[1:]
        
        return processed
    
    def _detect_voice_commands(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect voice commands in transcribed text
        """
        commands = []
        text_lower = text.lower()
        
        for command_type, patterns in self.command_patterns.items():
            for pattern in patterns:
                if pattern in text_lower:
                    # Calculate confidence based on pattern match
                    confidence = len(pattern) / len(text_lower) if text_lower else 0
                    
                    commands.append({
                        "type": command_type,
                        "pattern": pattern,
                        "confidence": min(confidence, 1.0),
                        "text": text
                    })
        
        return commands
    
    async def _generate_command_action(self, command: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate action based on detected command
        """
        command_type = command["type"]
        
        if command_type == "create_thought":
            return {
                "type": "create_thought",
                "message": "Opening thought creation interface",
                "data": {
                    "suggested_content": command["text"],
                    "source": "voice_command"
                }
            }
        
        elif command_type == "search":
            return {
                "type": "search",
                "message": "Initiating search",
                "data": {
                    "query": command["text"],
                    "source": "voice_command"
                }
            }
        
        elif command_type == "analyze":
            return {
                "type": "analyze",
                "message": "Starting analysis",
                "data": {
                    "target": command["text"],
                    "source": "voice_command"
                }
            }
        
        elif command_type == "collaborate":
            return {
                "type": "collaborate",
                "message": "Opening collaboration interface",
                "data": {
                    "context": command["text"],
                    "source": "voice_command"
                }
            }
        
        elif command_type == "spawn_agent":
            return {
                "type": "spawn_agent",
                "message": "Spawning new agent",
                "data": {
                    "prompt": command["text"],
                    "source": "voice_command"
                }
            }
        
        else:
            return {
                "type": "unknown",
                "message": "Command not recognized",
                "data": {}
            }
    
    async def _fallback_transcription(self, audio_data: bytes) -> Dict[str, Any]:
        """
        Fallback transcription when speech recognition is not available
        """
        return {
            "transcription": "[Voice input detected - speech recognition not available]",
            "original_text": "",
            "method": "fallback",
            "confidence": 0.0,
            "commands": [],
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Speech recognition libraries not installed"
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Health check for the voice processor
        """
        return {
            "status": "healthy",
            "speech_available": SPEECH_AVAILABLE,
            "audio_processing_available": AUDIO_PROCESSING_AVAILABLE,
            "recognizer_initialized": self.recognizer is not None,
            "whisper_available": self.whisper_model is not None,
            "command_patterns": len(self.command_patterns)
        }

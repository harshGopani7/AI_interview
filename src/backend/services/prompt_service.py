import os
from dotenv import load_dotenv
from config import db,prompts_collection

load_dotenv()


class PromptService:
    """Service for managing and retrieving prompts from database"""
    
    @staticmethod
    def get_prompt(name):
        """
        Retrieve a prompt by name from database
        
        Args:
            name (str): Name of the prompt
            
        Returns:
            str: Prompt text
        """
        try:
            prompt = prompts_collection.find_one({"name": name, "active": True})
            if not prompt:
                raise ValueError(f"Prompt '{name}' not found or inactive")
            
            
            return prompt["prompt_text"].strip()
            
        except Exception as e:
            print(f"Error retrieving prompt '{name}': {e}")
            raise
    
    @staticmethod
    def get_system_prompt(candidateName, role, natureOfRole, educationalQualification, pastYearsExperience, pastYearsExperienceField, currentYearExperience, currentYearExperienceField, coreSkillSet, typeOfCompany, interviewType, duration):
        """Get formatted system prompt for interview initialization"""
        prompt_text = PromptService.get_prompt("system_prompt")
        return prompt_text.format(
            candidateName=candidateName,
            role=role,
            natureOfRole=natureOfRole,
            educationalQualification= educationalQualification,
            pastYearsExperience=pastYearsExperience,
            pastYearsExperienceField=pastYearsExperienceField,
            currentYearExperience=currentYearExperience,
            currentYearExperienceField=currentYearExperienceField,
            coreSkillSet=coreSkillSet,
            typeOfCompany=typeOfCompany,
            interviewType=interviewType,
            duration=duration
        )
    
    @staticmethod
    def get_next_question_prompt(answer, time_remaining):
        """Get formatted prompt for generating next question"""
        prompt_text = PromptService.get_prompt("next_question_prompt")
        return prompt_text.format(
            answer=answer,
            time_remaining=time_remaining
        )
    
    @staticmethod
    def get_summary_prompt(violation_count):
        print(violation_count)
        """Get formatted prompt for interview summary"""
        prompt_text = PromptService.get_prompt("summary_prompt")
        # Use replace instead of format to avoid conflicts with JSON braces
        return prompt_text.replace("{violation_count}", str(violation_count))
    
    @staticmethod
    def get_first_question_prompt():
        """Get prompt for first question generation"""
        return PromptService.get_prompt("first_question_prompt")
    
    @staticmethod
    def list_all_prompts():
        """List all available prompts"""
        try:
            prompts = list(prompts_collection.find({"active": True}))
            return [{"name": p["name"], "description": p["description"]} for p in prompts]
        except Exception as e:
            print(f"Error listing prompts: {e}")
            return []

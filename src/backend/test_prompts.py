from services.prompt_service import PromptService

def test_prompt_service():
    """Test the prompt service functionality"""
    
    print("Testing Prompt Service...")
    print("="*50)
    
    try:
        # Test 1: Get system prompt
        print("\n1. Testing System Prompt:")
        system_prompt = PromptService.get_system_prompt(
            interview_type="Technical",
            role="Software Engineer",
            level="Senior",
            duration=60
        )
        print("✅ System prompt retrieved successfully")
        print(f"Length: {len(system_prompt)} characters")
        
        # Test 2: Get next question prompt
        print("\n2. Testing Next Question Prompt:")
        next_q_prompt = PromptService.get_next_question_prompt(
            answer="I have 5 years of experience in Python development",
            time_remaining=45
        )
        print("✅ Next question prompt retrieved successfully")
        print(f"Length: {len(next_q_prompt)} characters")
        
        # Test 3: Get summary prompt
        print("\n3. Testing Summary Prompt:")
        summary_prompt = PromptService.get_summary_prompt(violation_count=2)
        print("✅ Summary prompt retrieved successfully")
        print(f"Length: {len(summary_prompt)} characters")
        
        # Test 4: Get first question prompt
        print("\n4. Testing First Question Prompt:")
        first_q_prompt = PromptService.get_first_question_prompt()
        print("✅ First question prompt retrieved successfully")
        print(f"Content: {first_q_prompt}")
        
        # Test 5: List all prompts
        print("\n5. Listing All Available Prompts:")
        prompts = PromptService.list_all_prompts()
        for prompt in prompts:
            print(f"  - {prompt['name']}: {prompt['description']}")
        
        print("\n✅ All tests passed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_prompt_service()

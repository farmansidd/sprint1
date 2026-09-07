import json

from app.services.ai_service_updated import clean_json_response, normalize_roadmap_payload


def test_clean_json_response_accepts_root_array_of_levels():
    payload = '''[
      {
        "name": "Level 1",
        "topics": [
          {
            "name": "Python foundations",
            "description": "Core language concepts",
            "subtopics": [
              {
                "name": "Variables and data types",
                "description": "Learn about types and values",
                "skills": [
                  {
                    "id": "t1",
                    "name": "Variables",
                    "description": "Understand values and assignment",
                    "estimated_hours": 2,
                    "difficulty": "low",
                    "depends_on": [],
                    "resources": [{"title": "Python docs", "url": "https://docs.python.org/3/"}]
                  }
                ]
              }
            ],
            "micro_project": {
              "title": "Small script",
              "description": "Write a script",
              "requirements": ["Use variables"],
              "evaluation_criteria": ["Works"],
              "starter_code": "print(1)"
            }
          }
        ],
        "quiz": {"questions": [{"question": "What is Python?", "options": ["A","B","C","D"], "correct_answer": "A", "explanation": "A is correct."}]},
        "micro_project": {"title": "Level 1 project", "description": "Finish a small script", "requirements": ["Write code"], "evaluation_criteria": ["It runs"], "starter_code": "print('ok')"}
      },
      {
        "name": "Level 2",
        "topics": [],
        "quiz": {"questions": [{"question": "What is a function?", "options": ["A","B","C","D"], "correct_answer": "B", "explanation": "Functions encapsulate logic."}]},
        "micro_project": {"title": "Level 2 project", "description": "Solve a task", "requirements": ["Use functions"], "evaluation_criteria": ["Works"], "starter_code": "def hi():\n    pass"}
      }
    ]'''

    cleaned = clean_json_response(payload)
    parsed = json.loads(cleaned)
    normalized = normalize_roadmap_payload(parsed)

    assert isinstance(normalized, dict)
    assert normalized["levels"][0]["name"] == "Level 1"
    assert normalized["levels"][1]["name"] == "Level 2"
    assert normalized["title"] == "Roadmap"


def test_normalize_roadmap_payload_drops_non_object_levels_but_keeps_valid_content():
    payload = {
        "title": "Roadmap",
        "description": "Roadmap description",
        "summary": "Summary",
        "levels": [
            {
                "name": "Level 1",
                "topics": [{"name": "Topic 1", "subtopics": [{"name": "Subtopic 1", "skills": [{"id": "t1", "name": "Skill 1", "description": "Skill description", "estimated_hours": 2, "difficulty": "low", "depends_on": [], "resources": [{"title": "Doc", "url": "https://example.com"}]}]}]}],
                "quiz": {"questions": [{"question": "Q1", "options": ["A", "B", "C", "D"], "correct_answer": "A", "explanation": "Because A."}]},
                "micro_project": {"title": "Project 1", "description": "Do it", "requirements": ["One"], "evaluation_criteria": ["Pass"], "starter_code": "print('hi')"}
            },
            "junk",
            {
                "name": "Level 3",
                "topics": [{"name": "Topic 3", "subtopics": [{"name": "Subtopic 3", "skills": []}]}],
                "quiz": {"questions": []},
                "micro_project": {"title": "Project 3", "description": "Do this", "requirements": [], "evaluation_criteria": [], "starter_code": ""}
            }
        ]
    }

    normalized = normalize_roadmap_payload(payload)

    assert len(normalized["levels"]) == 2
    assert normalized["levels"][0]["name"] == "Level 1"
    assert normalized["levels"][1]["name"] == "Level 3"

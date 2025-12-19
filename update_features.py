import re

# Read the file
with open('src/pages/Features.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add the import
content = content.replace(
    'import StyleDetailsModal from "@/components/StyleDetailsModal";',
    'import StyleDetailsModal from "@/components/StyleDetailsModal";\nimport { useUserStyles, useUserCharacters } from "@/hooks/useUserData";'
)

# Replace the CharactersList component
old_component = '''const CharactersList = () => {
  const [savedCharacters, setSavedCharacters] = useState([]);

  useEffect(() => {
    const characters = JSON.parse(localStorage.getItem('savedCharacters') || '[]');
    setSavedCharacters(characters);
  }, []);

  const deleteCharacter = (characterId: string, characterName: string) => {
    const updatedCharacters = savedCharacters.filter((char: any) => char.id !== characterId);
    setSavedCharacters(updatedCharacters);
    localStorage.setItem('savedCharacters', JSON.stringify(updatedCharacters));
  };'''

new_component = '''const CharactersList = () => {
  const { characters: savedCharacters, deleteCharacter } = useUserCharacters();'''

content = content.replace(old_component, new_component)

# Also need to update the deleteCharacter call to only pass one argument
content = content.replace(
    'onClick={() => deleteCharacter(character.id, character.name)}',
    'onClick={() => deleteCharacter(character.id)}'
)

# Write the file back
with open('src/pages/Features.tsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)

print("File updated successfully!")

const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/pages/Features.tsx', 'utf8');

// Add the import
content = content.replace(
    'import StyleDetailsModal from "@/components/StyleDetailsModal";',
    'import StyleDetailsModal from "@/components/StyleDetailsModal";\r\nimport { useUserStyles, useUserCharacters } from "@/hooks/useUserData";'
);

// Replace the CharactersList component
const oldComponent = `const CharactersList = () => {
  const [savedCharacters, setSavedCharacters] = useState([]);

  useEffect(() => {
    const characters = JSON.parse(localStorage.getItem('savedCharacters') || '[]');
    setSavedCharacters(characters);
  }, []);

  const deleteCharacter = (characterId: string, characterName: string) => {
    const updatedCharacters = savedCharacters.filter((char: any) => char.id !== characterId);
    setSavedCharacters(updatedCharacters);
    localStorage.setItem('savedCharacters', JSON.stringify(updatedCharacters));
  };`;

const newComponent = `const CharactersList = () => {
  const { characters: savedCharacters, deleteCharacter } = useUserCharacters();`;

content = content.replace(oldComponent, newComponent);

// Also need to update the deleteCharacter call to only pass one argument  
content = content.replace(
    'onClick={() => deleteCharacter(character.id, character.name)}',
    'onClick(() => deleteCharacter(character.id)}'
);

// Write the file back
fs.writeFileSync('src/pages/Features.tsx', content, 'utf8');

console.log("File updated successfully!");

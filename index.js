
```javascript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

interface Recipe {
  name: string;
  calories: number;
  ingredients: string[];
  instructions: string;
  servings: number;
  prepTime: string;
}

async function generateHealthyRecipe(
  cuisineType: string,
  targetCalories: number,
  dietaryRestrictions: string[] = []
): Promise<Recipe> {
  const restrictionsText =
    dietaryRestrictions.length > 0
      ? `Dietary restrictions: ${dietaryRestrictions.join(", ")}`
      : "";

  const prompt = `Generate a healthy recipe with the following specifications:
- Cuisine type: ${cuisineType}
- Target calories: ${targetCalories} per serving
${restrictionsText}

Respond in JSON format with the following structure:
{
  "name": "Recipe name",
  "calories": number (approximate calories per serving),
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": "Step by step cooking instructions",
  "servings": number,
  "prepTime": "XX minutes"
}

Make sure the recipe is healthy, nutritious, and delicious.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse recipe from response");
  }

  const recipe: Recipe = JSON.parse(jsonMatch[0]);
  return recipe;
}

async function generateMealPlan(
  dietGoal: string,
  daysCount: number = 3
): Promise<Record<string, Recipe[]>> {
  const prompt = `Generate a ${daysCount}-day meal plan for someone with the following goal: ${dietGoal}

For each day, include breakfast, lunch, dinner, and one healthy snack.
Each recipe should be healthy and contribute to the overall dietary goal.

Respond in JSON format with the following structure:
{
  "Day 1": [
    {
      "meal": "breakfast/lunch/dinner/snack",
      "name": "Recipe name",
      "calories": number,
      "ingredients": ["ingredient 1", "ingredient 2", ...],
      "instructions": "Step by step cooking instructions",
      "servings": 1,
      "prepTime": "XX minutes"
    },
    ...
  ],
  ...
}

Make sure all recipes are healthy, nutritious, and the daily calorie count aligns with the diet goal.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from the response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse meal plan from response");
  }

  const mealPlan: Record<string, Recipe[]> = JSON.parse(jsonMatch[0]);
  return mealPlan;
}

async function calculateNutritionTips(
  dailyCalories: number,
  goals: string[]
): Promise<string> {
  const prompt = `As a nutrition expert, provide personalized nutrition tips for someone with:
- Daily calorie target: ${dailyCalories} calories
- Goals: ${goals.join(", ")}

Provide 5-7 specific, actionable nutrition tips that are evidence-based and practical.
Format as a numbered list.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

async function main() {
  console.log("🍽️  Healthy Recipe Generator with Calorie Counter\n");
  console.log("=".repeat(50));

  // Generate a single healthy recipe
  console.log("\n📝 Generating a Mediterranean recipe (500 calories)...\n");
  const recipe = await generateHealthyRecipe("Mediterranean", 500, [
    "vegetarian",
  ]);

  console.log(`Recipe: ${recipe.name}`);
  console.log(`Calories per serving: ${recipe.calories}`);
  console.log(`Prep time: ${recipe.prepTime}`);
  console.log(`Servings: ${recipe.servings}`);
  console.log("\nIngredients:");
  recipe.ingredients.forEach((ing) => console.log(`  - ${ing}`));
  console.log("\nInstructions:");
  console.log(recipe.instructions);

  // Generate a 3-day meal plan
  console.log("\n" + "=".repeat(50));
  console.log("\n📅 Generating a 3-day meal plan for weight loss...\n");
  const mealPlan = await generateMealPlan("lose weight healthily", 3);

  for (const [day, meals] of Object.entries(mealPlan)) {
    console.log(`\n${day}:`);
    let dayCalories = 0;
    for (const meal of meals) {
      console.log(`  - ${meal.name}: ${meal.calories} calories`);
      dayCalories += meal.calories;
    }
    console.log(`  
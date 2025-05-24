import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from datetime import datetime
from sklearn.metrics import mean_absolute_error, r2_score

# Load and preprocess dataset
df = pd.read_csv("restaurant_sales.csv")
df['date'] = pd.to_datetime(df['date'])

# Group by date, weekday, and item
df_grouped = df.groupby(['date', 'day_of_week', 'item_name']).agg({
    'quantity': 'sum'
}).reset_index()

# Label encoding for items and weekdays
item_encoder = LabelEncoder()
day_encoder = LabelEncoder()
df_grouped['item_code'] = item_encoder.fit_transform(df_grouped['item_name'])
df_grouped['day_code'] = day_encoder.fit_transform(df_grouped['day_of_week'])

# Add date features
df_grouped['day'] = df_grouped['date'].dt.day
df_grouped['month'] = df_grouped['date'].dt.month
df_grouped['year'] = df_grouped['date'].dt.year

# Features and target
X = df_grouped[['item_code', 'day_code', 'day', 'month', 'year']]
y = df_grouped['quantity']

# Train model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

# Save model and encoders for Flask app
joblib.dump(model, 'restaurant_model.joblib')
joblib.dump(item_encoder, 'item_encoder.joblib')
joblib.dump(day_encoder, 'day_encoder.joblib')

# 🔮 Predict for next week (each weekday)
today = datetime.today()
days_map = list(day_encoder.classes_)  # ['Friday', 'Monday', ...]

results = {}

for i, weekday in enumerate(days_map):
    future_date = today + pd.DateOffset(days=(i - today.weekday() + 7) % 7)
    day_code = day_encoder.transform([weekday])[0]

    pred_data = pd.DataFrame({
        'item_name': item_encoder.classes_,
        'item_code': range(len(item_encoder.classes_)),
        'day_code': day_code,
        'day': future_date.day,
        'month': future_date.month,
        'year': future_date.year
    })

    X_pred = pred_data[['item_code', 'day_code', 'day', 'month', 'year']]
    pred_data['predicted_quantity'] = model.predict(X_pred)

    top5 = pred_data.sort_values(by='predicted_quantity', ascending=False).head(5)
    results[weekday] = top5[['item_name', 'predicted_quantity']]

# 📋 Show results
for weekday, items in results.items():
    print(f"\n📅 Predicted Top Menu Items for {weekday}:\n")
    for _, row in items.iterrows():
        print(f"🍽️ {row['item_name']} — estimated {round(row['predicted_quantity'])} orders")

# 🧪 Model evaluation (on training set)
y_train_pred = model.predict(X)
print("\n🎯 Model Accuracy:")
print("MAE:", round(mean_absolute_error(y, y_train_pred), 2))
print("R² Score:", round(r2_score(y, y_train_pred), 3))

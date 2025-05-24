from flask import Flask, render_template, request
import joblib
import pandas as pd
from datetime import datetime

app = Flask(__name__)



# Load model and encoders
model = joblib.load('restaurant_model.joblib')
item_encoder = joblib.load('item_encoder.joblib')
day_encoder = joblib.load('day_encoder.joblib')

@app.route('/')
def home():
    return render_template('index.html', days=day_encoder.classes_)

@app.route('/predict', methods=['POST'])
def predict():
    weekday = request.form.get('weekday')

    if not weekday:
        return "No weekday selected", 400
    today = datetime.today()

    try:
        day_code = day_encoder.transform([weekday])[0]
    except ValueError:
        return f"Invalid weekday: {weekday}", 400

    try:
        future_date = today + pd.DateOffset(
            days=(list(day_encoder.classes_).index(weekday) - today.weekday() + 7) % 7
        )
    except ValueError:
        return "Invalid weekday selected", 400

    # Prepare prediction DataFrame
    pred_data = pd.DataFrame({
        'item_name': item_encoder.classes_,
        'item_code': range(len(item_encoder.classes_)),
        'day_code': day_encoder.transform([weekday])[0],
        'day': future_date.day,
        'month': future_date.month,
        'year': future_date.year
    })

    X_pred = pred_data[['item_code', 'day_code', 'day', 'month', 'year']]
    pred_data['predicted_quantity'] = model.predict(X_pred)

    top_items = pred_data.sort_values('predicted_quantity', ascending=False).head(5)
    results = top_items[['item_name', 'predicted_quantity']].values.tolist()

    return render_template(
        'results.html',
        weekday=weekday,
        date=future_date.strftime("%Y-%m-%d"),
        predictions=results
    )

if __name__ == '__main__':
    app.run(debug=True)

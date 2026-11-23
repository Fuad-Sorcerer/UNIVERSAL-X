import os
import json
from flask import Flask, render_template, jsonify, request
import sympy as sp

app = Flask(__name__)
FORMULAS_DIR = 'formulas'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/categories')
def get_categories():
    if not os.path.exists(FORMULAS_DIR):
        return jsonify([])
    files = [f[:-5] for f in os.listdir(FORMULAS_DIR) if f.endswith('.json')]
    return jsonify(sorted(files))

@app.route('/formulas/<category>')
def get_formulas(category):
    path = os.path.join(FORMULAS_DIR, f'{category}.json')
    if not os.path.exists(path):
        return jsonify([])
    with open(path, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    eq_str = data.get('equation', '')
    values = data.get('values', {})
    units = data.get('units', {})

    missing = [k for k, v in values.items() if str(v).strip() == '']
    if len(missing) != 1:
        return jsonify({'error': 'Leave exactly 1 field empty to solve!'})

    target_var = missing[0]
    try:
        local_dict = {k: sp.Symbol(k) for k in values.keys()}
        local_dict['sqrt'] = sp.sqrt
        local_dict['pi'] = sp.pi
        expr = sp.sympify(eq_str, locals=local_dict)

        subs_dict = {local_dict[k]: float(v) for k, v in values.items() if k != target_var}
        solved_expr = expr.subs(subs_dict)
        solutions = sp.solve(solved_expr, local_dict[target_var])

        real_sols = [complex(s.evalf()).real for s in solutions if abs(complex(s.evalf()).imag) < 1e-9]
        if not real_sols:
            return jsonify({'error': 'No real solution found.'})

        ans = round(real_sols[0], 6)
        unit = units.get(target_var, '')
        return jsonify({'result': f'{target_var} = {ans} {unit}'.strip()})
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True)
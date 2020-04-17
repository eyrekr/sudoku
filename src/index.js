import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

ReactDOM.render(<Game />, document.getElementById('root'));

function Game() {
    const [squares, setSquares] = useState(emptySquares);
    const [selected, setSelected] = useState(0);
    const selectedSquare = selected != null ? squares[selected] : null;
    const [lockedValue, setLockedValue] = useState(1);

    // useEffect(() => {
    //     const loadedSquares = deserializeSquares(localStorage.getItem('board'));
    //     reduceCandidates(loadedSquares);
    //     setSquares(loadedSquares);
    // });

    function handleKey(e) {
        console.log('KEY: ' + e.key + ' SHIFT: ' + e.shiftKey + ' ALT: ' + e.altKey + ' CODE: ' + e.keyCode);
        if (e.shiftKey) {
            if (squareHasNoValue(selectedSquare) && e.keyCode >= 49 && e.keyCode <= 57) {
                const clonedSquares = cloneSquares(squares);
                const value = e.keyCode - 48;
                const selectedSquare = clonedSquares[selected];
                if (squareHasCandidate(value)(selectedSquare)) {
                    removeCandidates(selectedSquare, [value]);
                } else {
                    selectedSquare.candidates.push(value);
                    selectedSquare.candidates.sort();
                }
                setSquares(clonedSquares);
            }
            return;
        } else if (e.ctrlKey || e.altKey) {
            if (e.keyCode >= 49 && e.keyCode <= 57) {
                const value = e.keyCode - 48;
                if (value != lockedValue) {
                    setLockedValue(value);
                }
            }
            return;
        }

        switch (e.key) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9': {
                const clonedSquares = cloneSquares(squares, resetingCandidates);
                const value = parseInt(e.key);
                clonedSquares[selected] = square(selected, value);
                reduceCandidates(clonedSquares);
                setSquares(clonedSquares);
                break;
            }
            case 'Backspace': {
                // TODO Implement HISTORY + UNDO 
                const clonedSquares = cloneSquares(squares, resetingCandidates);
                clonedSquares[selected] = square(selected);
                reduceCandidates(clonedSquares);
                setSquares(clonedSquares);
                break;
            }
            case 'ArrowUp':
                setSelected((selected + 72) % 81);
                break;
            case 'ArrowDown':
                setSelected((selected + 9) % 81);
                break;
            case 'ArrowRight':
                setSelected((selected + 1) % 81);
                break;
            case 'ArrowLeft':
                setSelected((selected + 80) % 81);
                break;
            case 'a': { // auto-complete
                const clonedSquares = cloneSquares(squares, upliftingSoleValue);
                reduceCandidates(clonedSquares);
                setSquares(clonedSquares);
                break;
            }
            case 'r': { // repeat reduction
                const clonedSquares = cloneSquares(squares);                
                reduceCandidates(clonedSquares);
                setSquares(clonedSquares);
                break;
            }
            case 's': { // save
                localStorage.setItem('board', serializeSquares(squares));
                break;
            }
            case 'l': { // load
                const loadedSquares = deserializeSquares(localStorage.getItem('board'));
                reduceCandidates(loadedSquares);
                setSquares(loadedSquares);
                break;
            }
            case 'c': { // clear
                setSquares(emptySquares());
                break;
            }
        }
    }

    const elements = rows(squares).map((squares, index) => <Row
        key={index} 
        squares={squares} 
        selectedSquare={selectedSquare}
        onSelectSquare={setSelected}
        lockedValue={lockedValue} />);

    return (
        <div className="game" onKeyDown={handleKey} tabIndex="0">
            {elements}
        </div>
    );
}

function Row({squares, selectedSquare, onSelectSquare, lockedValue}) {
    const elements = squares.map(square => <Square 
        key={square.i} 
        square={square} 
        selectedSquare={selectedSquare}
        onSelectSquare={onSelectSquare}
        lockedValue={lockedValue} />);
    return (
        <div className="board-row">
            {elements}
        </div>
    );
}

function Square({square, selectedSquare, onSelectSquare, lockedValue}) {
    let className = "square";
    let valueToDisplay = square.value;
    
    if (selectedSquare.i === square.i) {
        className += " selected";
    } 
    
    if (squareHasCandidate(lockedValue)(square) && selectedSquare.i !== square.i) {
        className += " highlighted";
    }

    if (valueToDisplay != null) {
         if (square.candidates.includes(valueToDisplay)) {
            // everything is fine
         } else {
             className += " invalid";
         }
    } else {
        if (square.candidates.length === 0) {
            className += " invalid";
            valueToDisplay = '!';
        } else if (square.candidates.length === 1) {
            className += " uniqueCandidate";
            valueToDisplay = square.candidates[0];
        } else {
            className += " candidates";
            valueToDisplay = square.candidates.join('');
        }
    } 

    return (
        <div className={className} onClick={() => onSelectSquare(square.i)}>
            {valueToDisplay}
        </div>
    );
}

function square(i, value, candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const smartCandidates = (value == null) ? candidates : [value];
    return {
        i: i,
        row: Math.floor(i / 9),
        column: i % 9,
        house: 3 * Math.floor(i / 27) + Math.floor((i % 9) / 3),
        value: value,
        candidates: smartCandidates
    }
}

function emptySquares() {
    return Array(81).fill(null).map((_, index) => square(index, null));
}

function cloneSquares(squares, transform = ({i, value, candidates}) => square(i, value, candidates)) {
    return squares.map(transform);
}

function resetingCandidates({i, value}) {
    return square(i, value);
}

function upliftingSoleValue({i, value, candidates}) {
    return value == null && candidates.length === 1
        ? square(i, candidates[0], candidates)
        : square(i, value, candidates);
}

function serializeSquares(squares) {
    return squares.map(square => square.value || '_').join('');
}

function deserializeSquares(string) {
    return Array(81).fill(null).map((_, index) => {
        const ch = string.charAt(index);
        switch (ch) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                return square(index, parseInt(ch));
            default:
                return square(index);
        }
    });
}

function rows(squares) {
    return Array(9).fill(null).map((_, index) => squares.filter(square => square.row === index));
}

function columns(squares) {
    return Array(9).fill(null).map((_, index) => squares.filter(square => square.column === index));
}

function houses(squares) {
    return Array(9).fill(null).map((_, index) => squares.filter(square => square.house === index));
}

function reduceCandidates(squares) {
    basicElimination(squares);
    hiddenSingle(squares);
    ommission(squares);
    nakedPair(squares);
    nakedTripple(squares);
    hiddenPair(squares);
    xWing(squares);
}

// BASIC ELIMINATION
// the same value cannot be in the same house, row and column
function basicElimination(squares) {
    squares.filter(squareHasValue).forEach(square => 
        squares
            .filter(squareIsInTheSameRowColumnOrHouse(square))
            .filter(notThisSquare(square))
            .forEach(relatedSquare => removeCandidates(relatedSquare, [square.value])));
}

function squareHasValue({value}) {
    return value != null;
}

function notThisSquare({i}) {
    return square => square.i !== i;
}

function squareIsInTheSameRowColumnOrHouse({house, row, column}) {
    return square => square.house === house || square.row === row || square.column === column;
}

// HIDDEN SINGLE 
// there is no other square in which the value can be in the row/column/block
// https://www.learn-sudoku.com/lone-singles.html
function hiddenSingle(squares) {
    function revealIn(grouping) {
        for (let squaresInGroup of grouping(squares)) {
            const histogram = histogramOfCandidates(squaresInGroup);
            for (let candidate = 1; candidate <= 9; candidate++) {
                const squaresWithCandidate = histogram[candidate];
                if (squaresWithCandidate.length === 1) {
                    squaresWithCandidate[0].candidates = [candidate];
                }
            }
        }
    }

    revealIn(houses);
    revealIn(columns);
    revealIn(rows);
}

// { 1: [A, B, C], 2: [A], 3: [], 4: [A, B, D], ...}
function histogramOfCandidates(squares) {
    const histogram = {};
    for (let candidate = 1; candidate <= 9; candidate++) {
        histogram[candidate] = squares.filter(squareHasNoValue).filter(squareHasCandidate(candidate));
    }
    return histogram;   
}

function squareHasNoValue({value}) {
    return value == null;
}

function squareHasCandidate(value) {
    return ({candidates}) => candidates != null && candidates.includes(value);
}

function removeCandidates(square, values) {
    square.candidates = square.candidates.filter(value => !values.includes(value));
}


// OMMISSION
// candidate only in one column/row in one house => candidate cannot be anywhere else in the column/row
// https://www.learn-sudoku.com/omission.html
function ommission(squares) {
    for (let squaresInHouse of houses(squares)) {
        const histogram = histogramOfCandidates(squaresInHouse);
        for (let candidate = 1; candidate <= 9; candidate++) {
            const squaresWithCandidate = histogram[candidate];
            if (squaresWithCandidate.length >= 2) {
                if (allSquaresAreInOneRow(squaresWithCandidate)) {
                    const square = squaresWithCandidate[0];
                    squares
                        .filter(squareIsInTheSameRowAs(square))
                        .filter(squareIsNotInTheSameHouseAs(square))
                        .forEach(relatedSquare => removeCandidates(relatedSquare, [candidate]));
                } else if (allSquaresAreInOneColumn(squaresWithCandidate)) {
                    const square = squaresWithCandidate[0];
                    squares
                        .filter(squareIsInTheSameColumnAs(square))
                        .filter(squareIsNotInTheSameHouseAs(square))
                        .forEach(relatedSquare => removeCandidates(relatedSquare, [candidate]));
                }
            }
        }
    }
}

function allSquaresAreInOneRow(squares) {
    const row = squares[0].row;
    return squares.every(square => square.row === row);
}

function allSquaresAreInOneColumn(squares) {
    const column = squares[0].column;
    return squares.every(square => square.column === column);
}

function squareIsNotInTheSameHouseAs({house}) {
    return square => square.house !== house;
}

function squareIsInTheSameRowAs({row}) {
    return square => square.row === row;
}

function squareIsInTheSameColumnAs({column}) {
    return square => square.column === column;
}


// NAKED PAIR
// two squares in the same row/column/house have identical two candidates, no other square in the same row/column/house can have those candidates
// https://www.learn-sudoku.com/naked-pairs.html
function nakedPair(squares) {
    function revealIn(grouping) {
        for (let squaresInGroup of grouping(squares)) {
            const interestingSquares = squaresInGroup
                .filter(squareHasNoValue)
                .filter(square => square.candidates.length === 2);

            interestingSquares.forEach(square => interestingSquares
                .filter(notThisSquare(square))
                .filter(squareHasIdenticalCandidatesAs(square))
                .forEach(squareWithIdenticalCandidates => squaresInGroup 
                    .filter(notThisSquare(square))
                    .filter(notThisSquare(squareWithIdenticalCandidates))
                    .forEach(relatedSquare => removeCandidates(relatedSquare, square.candidates))));
        }
    }

    revealIn(rows);
    revealIn(columns);
    revealIn(houses);
}

// NAKED TRIPPLE
// three squares in the same row/column/house have identical three candidates, no other square in the same row/column/house can have those candidates
// one of the squares can have only 2 of the values, not all three of them, e.g. 167 - 167 - 16 works too
// https://www.learn-sudoku.com/naked-triplets.html
function nakedTripple(squares) {
    function revealIn(grouping) {
        for (let squaresInGroup of grouping(squares)) {
            const interestingSquares = squaresInGroup
                .filter(squareHasNoValue)
                .filter(square => square.candidates.length === 3);

            interestingSquares.forEach(square => interestingSquares
                .filter(notThisSquare(square))
                .filter(squareHasIdenticalCandidatesAs(square))
                .forEach(squareWithIdenticalCandidates => squaresInGroup 
                    .filter(squareHasNoValue)
                    .filter(notThisSquare(square))
                    .filter(notThisSquare(squareWithIdenticalCandidates))
                    .filter(squareHasOnlyCandidatesAs(square))
                    .forEach(thirdSquare => squaresInGroup
                        .filter(notThisSquare(square))
                        .filter(notThisSquare(squareWithIdenticalCandidates))
                        .filter(notThisSquare(thirdSquare))
                        .forEach(relatedSquare => removeCandidates(relatedSquare, square.candidates)))));
        }
    }

    revealIn(rows);
    revealIn(columns);
    revealIn(houses);
}

function squareHasIdenticalCandidatesAs({candidates}) {
    return square => square.candidates.length === candidates.length
        && square.candidates.every(candidate => candidates.includes(candidate));
}

function squareHasOnlyCandidatesAs({candidates}) {
    return square => square.candidates.length <= candidates.length
        && square.candidates.every(candidate => candidates.includes(candidate));
}

// HIDDEN PAIR
// FIXME Reimplement this approach  :)
// https://www.learn-sudoku.com/hidden-pairs.html
function hiddenPair(squares) {
    function revealIn(grouping) {
        for (let squaresInGroup of grouping(squares)) {
            for (let a = 1; a <= 9; a++) {
                const squaresWithCandidateA = squaresInGroup
                    .filter(squareHasNoValue)
                    .filter(squareHasCandidate(a));
                if (squaresWithCandidateA.length === 2) {
                    for (let b = a + 1; b <= 9; b++) {
                        const squaresWithCandidateB = squaresInGroup
                            .filter(squareHasNoValue)
                            .filter(squareHasCandidate(b));
                        if (squaresWithCandidateB.length === 2) {
                            const squaresWithBothCandidates = squaresInGroup
                                .filter(squareHasNoValue)
                                .filter(squareHasCandidate(a))
                                .filter(squareHasCandidate(b));
                            if (squaresWithBothCandidates.length === 2) {
                                squaresWithBothCandidates.forEach(square => square.candidates = [a, b]);
                            }
                        }
                    }
                }
            }
        }
    }

    revealIn(rows);
    revealIn(columns);
    revealIn(houses);
}

// X-WING
// https://www.learn-sudoku.com/x-wing.html
function xWing(squares) {
    const squaresInRows = rows(squares);
    for (let candidate = 1; candidate <= 9; candidate++) {
        const interestingRows = squaresInRows
            .map(squaresInRow => squaresInRow
                .filter(squareHasNoValue)
                .filter(squareHasCandidate(candidate)))
            .filter(squaresInRow => squaresInRow.length === 2);

        combinationsWithoutRepetition(interestingRows)
            .filter(({a, b}) => a[0].column === b[0].column && a[1].column === b[1].column)
            .forEach(({a, b}) => squares
                .filter(squareHasNoValue)
                .filter(notTheseSquares(a))
                .filter(notTheseSquares(b))
                .filter(square => squareIsInTheSameColumnAs(a[0])(square) || squareIsInTheSameColumnAs(a[1])(square))
                .forEach(square => removeCandidates(square, [candidate])));
    }

    const squaresInColumns = columns(squares);
    for (let candidate = 1; candidate <= 9; candidate++) {
        const interestingColumns = squaresInColumns
            .map(squaresInColumn => squaresInColumn
                .filter(squareHasNoValue)
                .filter(squareHasCandidate(candidate)))
            .filter(squaresInColumn => squaresInColumn.length === 2);
        
        combinationsWithoutRepetition(interestingColumns)
            .filter(({a, b}) => a[0].row === b[0].row && a[1].row === b[1].row)
            .forEach(({a, b}) => squares
                .filter(squareHasNoValue)
                .filter(notTheseSquares(a))
                .filter(notTheseSquares(b))
                .filter(square => squareIsInTheSameRowAs(a[0])(square) || squareIsInTheSameRowAs(a[1])(square))
                .forEach(square => removeCandidates(square, [candidate])));
    }
}

function combinationsWithoutRepetition(array) {
    const combinations = [];
    for (let i = 0; i < array.length; i++) {
        for (let j = i + 1; j < array.length; j++) {
            combinations.push({ a: array[i], b: array[j]});
        }
    }
    return combinations;
}

function notTheseSquares(squares) {
    const ids = squares.map(({i}) => i);
    return square => !ids.includes(square.i);
}

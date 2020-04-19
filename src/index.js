import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// REACT

ReactDOM.render(<Game />, document.getElementById('root'));

function Game() {
    const [squares, setSquares] = useState(() => {
        const serializedSquares = localStorage.getItem('board');
        if (serializedSquares != null) {
            const loadedSquares = deserializeSquares(serializedSquares);
            reduceCandidates(loadedSquares);
            return loadedSquares;
        }
        return emptySquares();
    });
    const [selected, setSelected] = useState(0);
    const selectedSquare = squares[selected];
    const [lockedValue, setLockedValue] = useState(1);

    function handleKey(e) {
        console.log('KEY: ' + e.key + ' SHIFT: ' + e.shiftKey + ' ALT: ' + e.altKey + ' CODE: ' + e.keyCode);
        if (e.shiftKey) {
            if (squareHasNoValue(selectedSquare) && e.keyCode >= 49 && e.keyCode <= 57) {
                const clonedSquares = cloneSquares(squares);
                const value = e.keyCode - 48;
                const selectedSquare = clonedSquares[selected];
                if (squareHasCandidate(value)(selectedSquare)) {
                    removeCandidates(value)(selectedSquare);
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
                if (value !== lockedValue) {
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

// MODEL

function candidates() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
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

// CALCULATIONS

function reduceCandidates(squares) {
    basicElimination(squares);
    hiddenSingle(squares);
    ommission(squares);
    nakedPair(squares);
    nakedTripple(squares);
    hiddenPair(squares);
    xWing(squares);
}



// values
function squareHasValue({value}) {
    return value != null;
}

function squareHasNoValue({value}) {
    return value == null;
}

// positions
function notThisSquare({i}) {
    return square => square.i !== i;
}

function notTheseSquares(squares) {
    const ids = squares.map(({i}) => i);
    return square => !ids.includes(square.i);
}

function squareIsInTheSameRowColumnOrHouseAs({house, row, column}) {
    return square => square.house === house || square.row === row || square.column === column;
}

function squareIsInTheSameRowAs({row}) {
    return square => square.row === row;
}

function squareIsInTheSameColumnAs({column}) {
    return square => square.column === column;
}

function squareIsNotInTheSameHouseAs({house}) {
    return square => square.house !== house;
}

function allSquaresAreInOneRow(squares) {
    const row = squares[0].row;
    return squares.every(square => square.row === row);
}

function allSquaresAreInOneColumn(squares) {
    const column = squares[0].column;
    return squares.every(square => square.column === column);
}

// candidates
function squareHasCandidate(value) {
    return ({candidates}) => candidates != null && candidates.includes(value);
}

function squareHasIdenticalCandidatesAs({candidates}) {
    return square => square.candidates.length === candidates.length
        && square.candidates.every(candidate => candidates.includes(candidate));
}

function squareHasOnlyCandidatesAs({candidates}) {
    return square => square.candidates.length <= candidates.length
        && square.candidates.every(candidate => candidates.includes(candidate));
}

/**
 * Usage:
 * [A, B, C, D, E].forEach(removeCandidates(1, 2, 3));
 * [A, B, C, D, E].forEach(removeCandidates([1, 2, 3]));
 * 
 * @param {*} values values to be removed
 */
function removeCandidates() {
    const values = [...arguments].flat();
    return square => square.candidates = square.candidates.filter(value => !values.includes(value));
}

// [[1, [A, B, C]], [2, [A]], ...]
function candidateAndSquares(squares) {
    return candidates().map(candidate => [candidate, squares.filter(squareHasNoValue).filter(squareHasCandidate(candidate))]);
}




// BASIC ELIMINATION
// the same value cannot be in the same house, row and column
function basicElimination(squares) {
    squares.filter(squareHasValue).forEach(square => 
        squares
            .filter(squareIsInTheSameRowColumnOrHouseAs(square))
            .filter(notThisSquare(square))
            .forEach(removeCandidates(square.value)));
}



// OMMISSION
// candidate only in one column/row in one house => candidate cannot be anywhere else in the column/row
// https://www.learn-sudoku.com/omission.html
function ommission(squares) {
    houses(squares)
        .flatMap(candidateAndSquares)
        .filter(([_, squares]) => squares.length >= 2)
        .forEach(([candidate, squaresWithCandidate]) => {
                const square = squaresWithCandidate[0];
                if (allSquaresAreInOneRow(squaresWithCandidate)) {
                    squares
                        .filter(squareIsInTheSameRowAs(square))
                        .filter(squareIsNotInTheSameHouseAs(square))
                        .forEach(removeCandidates(candidate));
                } else if (allSquaresAreInOneColumn(squaresWithCandidate)) {
                    squares
                        .filter(squareIsInTheSameColumnAs(square))
                        .filter(squareIsNotInTheSameHouseAs(square))
                        .forEach(removeCandidates(candidate));
                }
            });
}



// HIDDEN SINGLE 
// there is no other square in which the value can be in the row/column/block
// https://www.learn-sudoku.com/lone-singles.html
function hiddenSingle(squares) {
    function revealIn(groupsOf) {
        groupsOf(squares) // [[A, B, C], [D, E, F]]
            .flatMap(candidateAndSquares) // [1, [A, B]]
            .filter(([_, squares]) => squares.length === 1)
            .forEach(([candidate, squares]) => squares[0].candidates = [candidate]);
    }

    revealIn(houses);
    revealIn(columns);
    revealIn(rows);
}


// HIDDEN PAIR
// FIXME Reimplement this approach  :)
// https://www.learn-sudoku.com/hidden-pairs.html
function hiddenPair(squares) {
    function revealIn(groupsOf) {
        for (let squaresInGroup of groupsOf(squares)) {
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





// NAKED PAIR
// two squares in the same row/column/house have identical two candidates, no other square in the same row/column/house can have those candidates
// https://www.learn-sudoku.com/naked-pairs.html
function nakedPair(squares) {
    function revealIn(groupsOf) {
        groupsOf(squares).forEach(squaresInGroup => {
            const squaresWithTwoCandidates = squaresInGroup
                .filter(squareHasNoValue)
                .filter(square => square.candidates.length === 2);

            allUniquePairs(squaresWithTwoCandidates)
                .filter(([a, b]) => squareHasIdenticalCandidatesAs(a)(b))
                .forEach(([a, b]) => squaresInGroup 
                    .filter(notTheseSquares([a, b]))
                    .forEach(removeCandidates(a.candidates)));
        });
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
    function revealIn(groupsOf) {
        groupsOf(squares).forEach(squaresInGroup => {
            const squaresWithThreeCandidates = squaresInGroup
                .filter(squareHasNoValue)
                .filter(square => square.candidates.length === 3);

            allUniquePairs(squaresWithThreeCandidates)
                .filter(([a, b]) => squareHasIdenticalCandidatesAs(a)(b))
                .forEach(([square, squareWithIdenticalCandidates]) => squaresInGroup 
                    .filter(squareHasNoValue)
                    .filter(notTheseSquares([square, squareWithIdenticalCandidates]))
                    .filter(squareHasOnlyCandidatesAs(square))
                    .forEach(thirdSquare => squaresInGroup
                        .filter(notTheseSquares([square, squareWithIdenticalCandidates, thirdSquare]))
                        .forEach(removeCandidates(square.candidates))));
        });
    }

    revealIn(rows);
    revealIn(columns);
    revealIn(houses);
}



// X-WING
// https://www.learn-sudoku.com/x-wing.html
function xWing(squares) {
    const squaresInRows = rows(squares); // [[A,B,C], [D,E,F], [G,H,I], ...]
    candidates().forEach(candidate => {
        const rowsWhereOnlyTwoSquaresHaveTheCandidate = squaresInRows
            .map(squaresInRow => squaresInRow
                .filter(squareHasNoValue)
                .filter(squareHasCandidate(candidate)))
            .filter(squaresInRow => squaresInRow.length === 2);

        allUniquePairs(rowsWhereOnlyTwoSquaresHaveTheCandidate)
            .filter(([[a, b], [c, d]]) => a.column === c.column && b.column === d.column)
            .forEach(([[a, b], [c, d]]) => squares
                .filter(squareHasNoValue)
                .filter(notTheseSquares([a, b, c, d]))
                .filter(square => squareIsInTheSameColumnAs(a)(square) || squareIsInTheSameColumnAs(b)(square))
                .forEach(removeCandidates(candidate)));
    });

    const columnsWhereOnlyTwoSquaresHaveTheCandidate = columns(squares);
    candidates().forEach(candidate => {
        const interestingColumns = columnsWhereOnlyTwoSquaresHaveTheCandidate
            .map(squaresInColumn => squaresInColumn
                .filter(squareHasNoValue)
                .filter(squareHasCandidate(candidate)))
            .filter(squaresInColumn => squaresInColumn.length === 2);
        
        allUniquePairs(interestingColumns)
            .filter(([[a, b], [c, d]]) => a.row === c.row && b.row === d.row)
            .forEach(([[a, b], [c, d]]) => squares
                .filter(squareHasNoValue)
                .filter(notTheseSquares([a, b, c, d]))
                .filter(square => squareIsInTheSameRowAs(a)(square) || squareIsInTheSameRowAs(b)(square))
                .forEach(removeCandidates(candidate)));
    });
}

/**
 * All non-repeating combinations of the elements of the array.
 * Example: [1, 2, 3, 4] => [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]
 * 
 * @param {array} array source array for the pairing
 */
function allUniquePairs(array) {
    return array.flatMap((a, i) => array
        .filter((_, j) => i < j)
        .map(b => [a, b]));
}

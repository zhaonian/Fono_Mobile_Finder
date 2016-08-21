
function find_best_match(array, target)
{
        for (var i = 0; i < array.length; i ++) {
                if (array[i] == target)
                        return i;
        }
        return 0;
}

module.exports = {
	token: '',
	find_best_match: find_best_match,
};

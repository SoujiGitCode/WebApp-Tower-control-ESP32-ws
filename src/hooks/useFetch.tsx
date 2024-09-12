import { useState } from 'react';
import axios from 'axios';

const useFetch = (url: string, method = 'GET') => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async (body = null) => {
        setLoading(true);
        try {
            const response = await axios({ url, method, data: body });
            setData(response.data);
        } catch (err) {
            setError(err);
        }
        setLoading(false);
    };

    return { data, loading, error, fetchData };
};

export default useFetch;
